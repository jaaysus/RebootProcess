using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using Microsoft.AspNetCore.Authorization;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/modulelists")]
    public class ModuleListController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ModuleListController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var lists = await _db.ModuleLists
                .OrderByDescending(m => m.UploadDate)
                .Select(m => new
                {
                    m.Id,
                    m.FileName,
                    m.UploadDate,
                    m.UploadedBy,
                    EntryCount = m.Entries.Count,
                    CompositeCodes = m.Entries.Select(e => e.Composite).Distinct()
                })
                .ToListAsync();

            // Resolve composite names in one query rather than per-row
            var allCodes = lists.SelectMany(l => l.CompositeCodes).Distinct().ToList();
            var composites = await _db.Composites
                .Where(c => allCodes.Contains(c.CompositeCode))
                .ToDictionaryAsync(c => c.CompositeCode, c => c.CompositeName);

            var result = lists.Select(l => new
            {
                l.Id,
                l.FileName,
                l.UploadDate,
                l.UploadedBy,
                l.EntryCount,
                Composites = l.CompositeCodes.Select(code => new
                {
                    Code = code,
                    Name = composites.TryGetValue(code, out var name) ? name : null
                })
            });

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var moduleList = await _db.ModuleLists
                .Include(m => m.Entries)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (moduleList == null)
                return NotFound();

            var codes = moduleList.Entries.Select(e => e.Composite).Distinct().ToList();
            var composites = await _db.Composites
                .Where(c => codes.Contains(c.CompositeCode))
                .ToDictionaryAsync(c => c.CompositeCode, c => c.CompositeName);

            var result = new
            {
                moduleList.Id,
                moduleList.FileName,
                moduleList.UploadDate,
                moduleList.UploadedBy,
                Entries = moduleList.Entries.Select(e => new
                {
                    e.Id,
                    e.Composite,
                    CompositeName = composites.TryGetValue(e.Composite, out var name) ? name : null,
                    e.RowIndex,
                    e.Quantity,
                    e.Module,
                    e.CPN
                })
            };

            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _db.ModuleLists.FindAsync(id);
            if (existing == null)
                return NotFound();

            _db.ModuleLists.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully" });
        }

        [Authorize]
        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());
                var content = await reader.ReadToEndAsync();

                var lines = content.Split('\n')
                    .Select(l => l.Trim())
                    .Where(l => !string.IsNullOrEmpty(l))
                    .ToList();

                var dataLines = lines
                    .Where(l => !l.StartsWith("BOF") && !l.StartsWith("EOF"))
                    .ToList();

                if (!dataLines.Any())
                    return BadRequest("No data rows found in file.");

                var parsedRows = new List<(string Composite, int RowIndex, int Quantity, string Module, string CPN)>();

                foreach (var line in dataLines)
                {
                    var parts = line.Split(';');
                    if (parts.Length < 5)
                        return BadRequest($"Malformed line (expected 5 fields): {line}");

                    if (!int.TryParse(parts[1], out var rowIndex))
                        return BadRequest($"Invalid index value on line: {line}");

                    if (!int.TryParse(parts[2], out var quantity))
                        return BadRequest($"Invalid quantity value on line: {line}");

                    parsedRows.Add((
                        Composite: parts[0].Trim(),
                        RowIndex: rowIndex,
                        Quantity: quantity,
                        Module: parts[3].Trim(),
                        CPN: parts[4].Trim()
                    ));
                }

                var codesInFile = parsedRows.Select(r => r.Composite).Distinct().ToList();

                var matchedComposites = await _db.Composites
                    .Where(c => codesInFile.Contains(c.CompositeCode))
                    .ToDictionaryAsync(c => c.CompositeCode, c => c.CompositeName);

                var missingCodes = codesInFile.Except(matchedComposites.Keys).ToList();

                if (missingCodes.Any())
                {
                    return BadRequest($"Cannot upload: unknown composite code(s): {string.Join(", ", missingCodes)}");
                }

                var userIdClaim = User.FindFirst("UserId")?.Value;

                if (!Guid.TryParse(userIdClaim, out var userId))
                {
                    return Unauthorized(new { error = "Invalid Login." });
                }

                var currentUser = await _db.Users.FindAsync(userId);
                if (currentUser == null)
                {
                    return Unauthorized(new { error = "Invalid User." });
                }

                var moduleList = new ModuleList
                {
                    FileName = file.FileName,
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = userId,
                    Entries = parsedRows.Select(r => new ModuleListEntry
                    {
                        Composite = r.Composite,
                        RowIndex = r.RowIndex,
                        Quantity = r.Quantity,
                        Module = r.Module,
                        CPN = r.CPN
                    }).ToList()
                };

                _db.ModuleLists.Add(moduleList);
                await _db.SaveChangesAsync();

                var response = new
                {
                    moduleList.Id,
                    moduleList.FileName,
                    moduleList.UploadDate,
                    moduleList.UploadedBy,
                    Composites = codesInFile.Select(code => new { Code = code, Name = matchedComposites[code] }),
                    EntryCount = moduleList.Entries.Count
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
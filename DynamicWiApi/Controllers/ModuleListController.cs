using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

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
            var list = await _db.ModuleLists
                .OrderByDescending(m => m.UploadDate)
                .ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var moduleList = await _db.ModuleLists.FindAsync(id);
            if (moduleList == null)
                return NotFound();
            return Ok(moduleList);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ModuleList model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            model.UploadDate = DateTime.UtcNow;
            _db.ModuleLists.Add(model);
            await _db.SaveChangesAsync();
            return Ok(model);
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

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());
                var content = await reader.ReadToEndAsync();
                var lines = content.Split('\n').Select(l => l.Trim()).Where(l => !string.IsNullOrEmpty(l)).ToList();

                // Find all unique codes in the CSV (first column of data lines, excluding BOF and EOF)
                var codes = new HashSet<string>();
                foreach (var line in lines)
                {
                    var parts = line.Split(';');
                    if (parts.Length > 0 && parts[0] != null && parts[0] != "BOF" && parts[0] != "EOF")
                    {
                        codes.Add(parts[0].Trim());
                    }
                }

                // Validate that all codes exist in composites
                var existingCodes = await _db.Composites
                    .Select(c => c.CompositeCode)
                    .ToListAsync();

                var missingCodes = codes.Where(code => !existingCodes.Contains(code)).ToList();

                if (missingCodes.Any())
                {
                    return BadRequest($"Cannot upload: The following composite codes do not exist: {string.Join(", ", missingCodes)}");
                }

                // Get user ID from claim (you may need to adjust this based on your auth setup)
                var userIdClaim = User.FindFirst("UserId")?.Value;
                Guid? userId = null;
                
                if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out Guid parsedUserId))
                {
                    userId = parsedUserId;
                }
                else
                {
                    return BadRequest("User not authenticated or invalid user ID.");
                }

                var moduleList = new ModuleList
                {
                    FileName = file.FileName,
                    FileContent = content,
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = userId
                };

                _db.ModuleLists.Add(moduleList);
                await _db.SaveChangesAsync();

                return Ok(moduleList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}

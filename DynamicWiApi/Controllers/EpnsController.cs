using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
//using DynamicWiApi.DTOs;   // CavityDto, CreateEpnRequest, UpdateEpnRequest
using ClosedXML.Excel;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EpnController : ControllerBase
{
    private readonly AppDbContext _db;

    public EpnController(AppDbContext db) => _db = db;

    // ── GET api/epn ──────────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var epns = await _db.Epns
            .Include(e => e.Photo)
            .Include(e => e.Cavities)
            .ToListAsync();

        return Ok(epns.Select(MapToResponse));
    }

    // ── GET api/epn/{id} ─────────────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var epn = await _db.Epns
            .Include(e => e.Photo)
            .Include(e => e.Cavities)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (epn is null)
            return NotFound(new { message = $"EPN {id} not found." });

        return Ok(MapToResponse(epn));
    }

    // ── GET api/epn/code/{code} ──────────────────────────────────────────────
    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetByCode(string code)
    {
        var epn = await _db.Epns
            .Include(e => e.Photo)
            .Include(e => e.Cavities)
            .FirstOrDefaultAsync(e => e.EpnCode == code);

        if (epn is null)
            return NotFound(new { message = $"EPN '{code}' not found." });

        return Ok(MapToResponse(epn));
    }

    // ── POST api/epn ─────────────────────────────────────────────────────────
    // • Photo is required and is resolved by matching an already-uploaded EpnPhoto
    //   whose file name (without extension) equals the EPN code.
    // • Cavities are optional — if empty, NeedsCoordination = true.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEpnRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Epn))
            return BadRequest(new { message = "EPN code is required." });

        if (await _db.Epns.AnyAsync(e => e.EpnCode == req.Epn))
            return Conflict(new { message = $"EPN '{req.Epn}' already exists." });

        var photo = await FindPhotoByEpnCode(req.Epn);

        if (photo is null)
            return BadRequest(new { message = $"No photo found for EPN code '{req.Epn}'. Please upload the photo first." });

        bool hasCavities = req.Cavities is { Count: > 0 };

        var epn = new Epn
        {
            EpnCode           = req.Epn.Trim(),
            CavityCount       = req.CavityCount,
            NeedsCoordination = !hasCavities,
            Photo             = photo,
            Cavities          = hasCavities
                ? BuildCavities(req.Cavities)
                : new List<EpnCavity>()
        };

        _db.Epns.Add(epn);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = epn.Id }, MapToResponse(epn));
    }

    // ── PUT api/epn/{id} ─────────────────────────────────────────────────────
    // • Photo is required - must exist in EpnPhotos table
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEpnRequest req)
    {
        var epn = await _db.Epns
            .Include(e => e.Cavities)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (epn is null)
            return NotFound(new { message = $"EPN {id} not found." });

        bool codeChanged = !string.Equals(epn.EpnCode, req.Epn, StringComparison.OrdinalIgnoreCase);

        if (codeChanged && await _db.Epns.AnyAsync(e => e.EpnCode == req.Epn && e.Id != id))
            return Conflict(new { message = $"EPN code '{req.Epn}' is already used by another record." });

        if (codeChanged || epn.Photo is null)
        {
            var photo = await FindPhotoByEpnCode(req.Epn);
            if (photo is null)
                return BadRequest(new { message = $"No photo found for EPN code '{req.Epn}'. Please upload the photo first." });
            epn.Photo = photo;
        }

        bool hasCavities = req.Cavities is { Count: > 0 };

        if (hasCavities && req.Cavities.Count != req.CavityCount)
            return BadRequest(new { message = $"Expected {req.CavityCount} cavities, got {req.Cavities.Count}." });

        _db.EpnCavities.RemoveRange(epn.Cavities);

        epn.EpnCode           = req.Epn.Trim();
        epn.CavityCount       = req.CavityCount;
        epn.NeedsCoordination = !hasCavities;
        epn.Cavities          = hasCavities
            ? BuildCavities(req.Cavities, id)
            : new List<EpnCavity>();

        await _db.SaveChangesAsync();

        return Ok(MapToResponse(epn));
    }
    // ── PATCH api/epn/{id}/cavities ──────────────────────────────────────────
    // Used by the frontend to set coordinates after creation
    // (when NeedsCoordination was true). Flips the flag once done.
    [HttpPatch("{id:int}/cavities")]
    public async Task<IActionResult> SetCavities(
        int id,
        [FromBody] Dictionary<int, CavityDto> cavities)
    {
        if (cavities is null || cavities.Count == 0)
            return BadRequest(new { message = "Provide at least one cavity." });

        var epn = await _db.Epns
            .Include(e => e.Cavities)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (epn is null)
            return NotFound(new { message = $"EPN {id} not found." });

        if (cavities.Count != epn.CavityCount)
            return BadRequest(new { message = $"Expected {epn.CavityCount} cavities, got {cavities.Count}." });

        _db.EpnCavities.RemoveRange(epn.Cavities);

        epn.Cavities          = BuildCavities(cavities, id);
        epn.NeedsCoordination = false;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            epn.Id,
            epn.EpnCode,
            epn.NeedsCoordination,
            Cavities = epn.Cavities
                .OrderBy(c => c.CavityNumber)
                .Select(c => new { c.CavityNumber, c.X, c.Y, c.Size, c.Shape })
        });
    }

    // ── PATCH api/epn/{id}/match-photo ───────────────────────────────────────
    // Manually trigger photo re-matching for a specific EPN
    // (useful if the photo was uploaded after the EPN was created)
    // Photo is required - must exist in EpnPhotos table
    [HttpPatch("{id:int}/match-photo")]
    public async Task<IActionResult> MatchPhoto(int id)
    {
        var epn = await _db.Epns.FindAsync(id);
        if (epn is null)
            return NotFound(new { message = $"EPN {id} not found." });

        var photo = await FindPhotoByEpnCode(epn.EpnCode);
        if (photo is null)
            return BadRequest(new { message = $"No photo found for EPN code '{epn.EpnCode}'. Please upload the photo first." });

        epn.Photo = photo;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            epn.Id,
            epn.EpnCode,
            Photo = new
            {
                photo.Id,
                photo.FilePath,
                photo.PhotoWidth,
                photo.PhotoHeight
            }
        });
    }

    // ── DELETE api/epn/{id} ──────────────────────────────────────────────────
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var epn = await _db.Epns.FindAsync(id);
        if (epn is null)
            return NotFound(new { message = $"EPN {id} not found." });

        _db.Epns.Remove(epn); // cascade deletes EpnCavities
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ════════════════════════════════════════════════════════════════════════
    //  Private helpers
    // ════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Finds the EpnPhoto with matching EpnCode.
    /// </summary>
    private async Task<EpnPhoto?> FindPhotoByEpnCode(string epnCode)
    {
        var code = epnCode.Trim();
        return await _db.EpnPhotos
            .FirstOrDefaultAsync(p => p.EpnCode == code);
    }

    private static List<EpnCavity> BuildCavities(
        Dictionary<int, CavityDto> dict,
        int epnId = 0)
    {
        return dict.Select(kv => new EpnCavity
        {
            EpnId        = epnId,
            CavityNumber = kv.Key,
            X            = kv.Value.X,
            Y            = kv.Value.Y,
            Size         = kv.Value.Size,
            Shape        = kv.Value.Shape
        }).ToList();
    }

    private static object MapToResponse(Epn e) => new
    {
        e.Id,
        Epn         = e.EpnCode,
        e.CavityCount,
        e.NeedsCoordination,
        Photo       = e.Photo is null ? null : e.Photo.FilePath,
        PhotoWidth  = e.Photo?.PhotoWidth,
        PhotoHeight = e.Photo?.PhotoHeight,
            Cavities = e.Cavities
                .OrderBy(c => c.CavityNumber)
                .ToDictionary(
                    c => c.CavityNumber.ToString(),
                    c => new { c.X, c.Y, c.Size, c.Shape }
                )
    };


    // ── POST api/epn/import ──────────────────────────────────────────────────
    // Bulk-imports EPNs from an Excel file with columns "EPN" and "CavityCount".
    // Duplicate EPN codes (case-insensitive) are skipped automatically.
    [HttpPost("import")]
    public async Task<IActionResult> ImportFromExcel(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file uploaded.");

        using var stream = new MemoryStream();
        await file.CopyToAsync(stream);
        stream.Position = 0;

        using var workbook = new XLWorkbook(stream); // now lives for the whole method
        IXLWorksheet worksheet;
        try
        {
            worksheet = workbook.Worksheet(1);
        }
        catch (Exception ex)
        {
            return BadRequest($"Could not read Excel file: {ex.Message}");
        }


        // Locate "EPN" and "CavityCount" columns from the header row
        var headerRow = worksheet.Row(1);
        int epnCol = -1, cavityCol = -1;
        foreach (var cell in headerRow.CellsUsed())
        {
            var header = cell.GetString().Trim();
            if (header.Equals("EPN", StringComparison.OrdinalIgnoreCase))
                epnCol = cell.Address.ColumnNumber;
            else if (header.Equals("CavityCount", StringComparison.OrdinalIgnoreCase))
                cavityCol = cell.Address.ColumnNumber;
        }

        if (epnCol == -1 || cavityCol == -1)
            return BadRequest("Excel file must contain 'EPN' and 'CavityCount' columns.");

        var existingCodes = new HashSet<string>(
            await _db.Epns.Select(e => e.EpnCode).ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        // Load all photo codes once (fast)
        var photoCodes = new HashSet<string>(
            await _db.EpnPhotos.Select(p => p.EpnCode).ToListAsync(),
            StringComparer.OrdinalIgnoreCase);

        var results = new List<object>();
        var validEpns = new List<Epn>();

        int created = 0;
        int skipped = 0;
        int errors = 0;

        var lastRow = worksheet.LastRowUsed()?.RowNumber() ?? 1;

        for (int row = 2; row <= lastRow; row++)
        {
            var epnCode = worksheet.Cell(row, epnCol).GetString().Trim();

            // Remove accidental leading comma
            epnCode = epnCode.TrimStart(',');

            if (string.IsNullOrWhiteSpace(epnCode))
                continue;

            var cavityRaw = worksheet.Cell(row, cavityCol).GetString().Trim();

            if (!int.TryParse(cavityRaw, out int cavityCount))
            {
                errors++;
                results.Add(new
                {
                    Row = row,
                    Epn = epnCode,
                    Status = "error",
                    Message = "Invalid or missing CavityCount."
                });
                continue;
            }

            // Already exists in Epns table
            if (existingCodes.Contains(epnCode))
            {
                skipped++;
                results.Add(new
                {
                    Row = row,
                    Epn = epnCode,
                    Status = "skipped",
                    Message = "Exists"
                });
                continue;
            }

            // NEW: check photo existence BEFORE inserting
            if (!photoCodes.Contains(epnCode))
            {
                errors++;
                results.Add(new
                {
                    Row = row,
                    Epn = epnCode,
                    Status = "error",
                    Message = "Photo not found."
                });
                continue;
            }

            validEpns.Add(new Epn
            {
                EpnCode = epnCode,
                CavityCount = cavityCount,
                NeedsCoordination = true
            });

            existingCodes.Add(epnCode); // prevent duplicates within same file

            created++;
            results.Add(new
            {
                Row = row,
                Epn = epnCode,
                Status = "created",
                Message = (string?)null
            });
        }

        // Save ONLY the valid rows
        if (validEpns.Count > 0)
        {
            _db.Epns.AddRange(validEpns);
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            TotalRows = results.Count,
            Created = created,
            Skipped = skipped,
            Errors = errors,
            Rows = results
        });
    }
}
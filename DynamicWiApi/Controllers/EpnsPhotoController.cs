using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EpnPhotoController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    private const string PhotoSubfolder = "epn-photos";

    private static readonly string[] AllowedTypes =
        ["image/jpeg", "image/png", "image/webp"];

    public EpnPhotoController(AppDbContext db, IWebHostEnvironment env)
    {
        _db  = db;
        _env = env;
    }

    // ── GET api/epnphoto ─────────────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var photos = await _db.EpnPhotos
            .Select(p => new
            {
                p.Id,
                p.FilePath,
                p.PhotoWidth,
                p.PhotoHeight,
                p.UploadedAt
            })
            .ToListAsync();

        return Ok(photos);
    }

    // ── GET api/epnphoto/{id} ────────────────────────────────────────────────
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var photo = await _db.EpnPhotos
            .Include(p => p.Epns)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (photo is null)
            return NotFound($"Photo {id} not found.");

        return Ok(new
        {
            photo.Id,
            photo.FilePath,
            photo.PhotoWidth,
            photo.PhotoHeight,
            photo.UploadedAt,
            LinkedEpns = photo.Epns.Select(e => new { e.Id, e.EpnCode })
        });
    }

    // ── POST api/epnphoto/upload ─────────────────────────────────────────────
    // Single file upload. Width and height are read from form fields.
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(
        IFormFile file,
        [FromForm] int photoWidth,
        [FromForm] int photoHeight)
    {
        var result = await SavePhoto(file, photoWidth, photoHeight);
        if (result.Error is not null)
            return BadRequest(result.Error);

        return CreatedAtAction(nameof(GetById), new { id = result.Photo!.Id }, new
        {
            result.Photo.Id,
            result.Photo.FilePath,
            result.Photo.PhotoWidth,
            result.Photo.PhotoHeight,
            result.Photo.UploadedAt
        });
    }

    // ── POST api/epnphoto/upload-bulk ────────────────────────────────────────
    // Multiple files in one request.
    // Each file must be accompanied by per-file width/height passed as:
    //   widths[0]=800&heights[0]=600&widths[1]=1024&heights[1]=768
    // (standard form array binding)
    [HttpPost("upload-bulk")]
    public async Task<IActionResult> UploadBulk(
        List<IFormFile> files,
        [FromForm] List<int> widths,
        [FromForm] List<int> heights)
    {
        if (files is null || files.Count == 0)
            return BadRequest("No files provided.");

        if (widths.Count != files.Count || heights.Count != files.Count)
            return BadRequest("widths and heights must have the same count as files.");

        var succeeded = new List<object>();
        var failed    = new List<object>();

        for (int i = 0; i < files.Count; i++)
        {
            var result = await SavePhoto(files[i], widths[i], heights[i]);

            if (result.Error is not null)
            {
                failed.Add(new { FileName = files[i].FileName, Reason = result.Error });
                continue;
            }

            succeeded.Add(new
            {
                result.Photo!.Id,
                result.Photo.FilePath,
                result.Photo.PhotoWidth,
                result.Photo.PhotoHeight,
                result.Photo.UploadedAt
            });
        }

        var statusCode = failed.Count == 0 ? 200
                       : succeeded.Count == 0 ? 400
                       : 207; // 207 Multi-Status for partial success

        return StatusCode(statusCode, new { succeeded, failed });
    }

    // ── DELETE api/epnphoto/{id} ─────────────────────────────────────────────
    // Refuses deletion if any EPN still references this photo.
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var photo = await _db.EpnPhotos
            .Include(p => p.Epns)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (photo is null)
            return NotFound($"Photo {id} not found.");

        if (photo.Epns.Any())
            return Conflict(
                $"Photo is still referenced by {photo.Epns.Count} EPN(s): " +
                string.Join(", ", photo.Epns.Select(e => e.EpnCode)));

        var fileName = Path.GetFileName(photo.FilePath);
        var fullPath = Path.Combine(GetPhotosDirectory(), fileName);
        if (System.IO.File.Exists(fullPath))
            System.IO.File.Delete(fullPath);

        _db.EpnPhotos.Remove(photo);
        await _db.SaveChangesAsync();

        return NoContent();
    }



    // ════════════════════════════════════════════════════════════════════════
    //  Private helpers
    // ════════════════════════════════════════════════════════════════════════

    private string GetPhotosDirectory()
    {
        // Use epn-photos folder in backend project root (outside wwwroot) to survive frontend builds
        return Path.Combine(_env.ContentRootPath, PhotoSubfolder);
    }

    private async Task<(EpnPhoto? Photo, string? Error)> SavePhoto(
        IFormFile? file, int width, int height)
    {
        if (file is null || file.Length == 0)
            return (null, "File is empty.");

        if (!AllowedTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return (null, $"'{file.FileName}': only JPEG, PNG and WebP are accepted.");

        var uploadsDir = GetPhotosDirectory();
        Directory.CreateDirectory(uploadsDir);

        // Keep the original file name so EPN auto-matching works by name.
        // Append a timestamp suffix only if a file with that name already exists.
        var baseName  = Path.GetFileNameWithoutExtension(file.FileName).Trim();
        var extension = Path.GetExtension(file.FileName);
        var fileName  = $"{baseName}{extension}";
        var fullPath  = Path.Combine(uploadsDir, fileName);

        if (System.IO.File.Exists(fullPath))
        {
            fileName = $"{baseName}_{DateTime.UtcNow:yyyyMMddHHmmss}{extension}";
            fullPath = Path.Combine(uploadsDir, fileName);
        }

        await using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream);

        var photo = new EpnPhoto
        {
            FilePath    = $"/{PhotoSubfolder}/{fileName}",
            PhotoWidth  = width,
            PhotoHeight = height,
            UploadedAt  = DateTime.UtcNow
        };

        _db.EpnPhotos.Add(photo);
        await _db.SaveChangesAsync();

        return (photo, null);
    }
}
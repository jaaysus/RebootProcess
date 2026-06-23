using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/epn")]
    public class EpnInfoController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public EpnInfoController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.EpnInfos.OrderBy(e => e.Id).ToListAsync();
            return Ok(list.Select(ToDto));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.EpnInfos.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(ToDto(item));
        }

        [HttpGet("lookup/{epnValue}")]
        public async Task<IActionResult> GetByEpn(string epnValue)
        {
            var item = await _db.EpnInfos
                .FirstOrDefaultAsync(e => e.Epn.ToLower() == epnValue.ToLower());
            if (item == null)
                return NotFound(new { message = $"EPN '{epnValue}' not found." });
            return Ok(ToDto(item));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EpnInfo model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Default coords JSON with empty cavities
            if (string.IsNullOrEmpty(model.CoordinatesJson))
                model.CoordinatesJson = $"{{\"imageWidth\":{model.ImageWidth},\"imageHeight\":{model.ImageHeight},\"cavities\":{{}}}}";

            _db.EpnInfos.Add(model);
            await _db.SaveChangesAsync();
            return Ok(ToDto(model));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] EpnInfo model)
        {
            if (id != model.Id) return BadRequest("ID mismatch");

            var existing = await _db.EpnInfos.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Epn = model.Epn;
            existing.CavityCount = model.CavityCount;
            existing.HousingColor = model.HousingColor;
            existing.NeedsCoordination = model.NeedsCoordination;
            if (!string.IsNullOrEmpty(model.CoordinatesJson))
                existing.CoordinatesJson = model.CoordinatesJson;

            await _db.SaveChangesAsync();
            return Ok(ToDto(existing));
        }

        /// <summary>
        /// Update the cavity coordinates JSON for an EPN (x, y, size, shape per cavity number).
        /// </summary>
        [HttpPut("{id}/coordinates")]
        public async Task<IActionResult> UpdateCoordinates(int id, [FromBody] CoordinatesUpdateDto dto)
        {
            var existing = await _db.EpnInfos.FindAsync(id);
            if (existing == null) return NotFound();

            existing.CoordinatesJson = dto.CoordinatesJson;
            existing.NeedsCoordination = false;
            await _db.SaveChangesAsync();
            return Ok(ToDto(existing));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _db.EpnInfos.FindAsync(id);
            if (existing == null) return NotFound();
            _db.EpnInfos.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully" });
        }

        /// <summary>
        /// Upload an image for an EPN. Stores image in wwwroot/epn-images/,
        /// sets ImageWidth and ImageHeight from the uploaded file metadata.
        /// </summary>
        [HttpPost("{id}/image")]
        public async Task<IActionResult> UploadImage(int id, IFormFile image)
        {
            var existing = await _db.EpnInfos.FindAsync(id);
            if (existing == null) return NotFound();

            if (image == null || image.Length == 0)
                return BadRequest("No image file provided.");

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(image.ContentType.ToLower()))
                return BadRequest("Only JPEG, PNG, GIF, and WEBP images are allowed.");

            var uploadsDir = Path.Combine(_env.WebRootPath ?? "wwwroot", "epn-images");
            Directory.CreateDirectory(uploadsDir);

            var ext = Path.GetExtension(image.FileName);
            var fileName = $"{existing.Epn}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await image.CopyToAsync(stream);

            existing.Photo = $"/epn-images/{fileName}";
            await _db.SaveChangesAsync();

            return Ok(ToDto(existing));
        }

        private static object ToDto(EpnInfo e)
        {
            object? coords = null;
            try { coords = System.Text.Json.JsonSerializer.Deserialize<object>(e.CoordinatesJson); } catch { }
            return new
            {
                e.Id,
                e.Epn,
                e.CavityCount,
                e.HousingColor,
                e.Photo,
                e.ImageWidth,
                e.ImageHeight,
                e.NeedsCoordination,
                coordinates = coords
            };
        }
    }

    public class CoordinatesUpdateDto
    {
        public string CoordinatesJson { get; set; } = string.Empty;
    }
}

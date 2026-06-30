using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/composites")]
    public class CompositesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CompositesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var composites = await _db.Composites.OrderBy(c => c.Id).ToListAsync();
            return Ok(composites);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CompositeCreateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if composite code already exists
            var existing = await _db.Composites
                .FirstOrDefaultAsync(c => c.CompositeCode == dto.CompositeCode);
            
            if (existing != null)
                return BadRequest($"Composite code '{dto.CompositeCode}' already exists.");

            var composite = new Composite
            {
                CompositeName = dto.CompositeName,
                CompositeCode = dto.CompositeCode,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Composites.Add(composite);
            await _db.SaveChangesAsync();
            return Ok(composite);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CompositeUpdateDTO dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await _db.Composites.FindAsync(id);
            if (existing == null)
                return NotFound();

            // Check if composite code is being changed and if it conflicts with another
            if (existing.CompositeCode != dto.CompositeCode)
            {
                var codeExists = await _db.Composites
                    .AnyAsync(c => c.CompositeCode == dto.CompositeCode && c.Id != id);
                
                if (codeExists)
                    return BadRequest($"Composite code '{dto.CompositeCode}' already exists.");
            }

            existing.CompositeName = dto.CompositeName;
            existing.CompositeCode = dto.CompositeCode;
            existing.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _db.Composites.FindAsync(id);
            if (existing == null)
                return NotFound();

            _db.Composites.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully" });
        }
    }
}
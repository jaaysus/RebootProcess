using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/workinstructions")]
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
            var list = await _db.ModuleLists.OrderBy(m => m.Id).ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ModuleList model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.ModuleLists.Add(model);
            await _db.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ModuleList model)
        {
            if (id != model.Id)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existing = await _db.ModuleLists.FindAsync(id);
            if (existing == null)
                return NotFound();

            existing.LjsOrd = model.LjsOrd;
            existing.Module = model.Module;
            existing.Composite = model.Composite;

            await _db.SaveChangesAsync();
            return Ok(existing);
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
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);

                using var workbook = new XLWorkbook(stream);
                var ws = workbook.Worksheets.First();
                
                int ljsOrdCol = -1;
                int moduleCol = -1;
                int compositeCol = -1;

                var firstRow = ws.Row(1);
                foreach (var cell in firstRow.CellsUsed())
                {
                    var text = cell.GetFormattedString().Trim().ToLower();
                    if (text == "ljs_ord" || text == "ljsord" || text == "ljs ord")
                        ljsOrdCol = cell.Address.ColumnNumber;
                    else if (text == "module")
                        moduleCol = cell.Address.ColumnNumber;
                    else if (text == "composite")
                        compositeCol = cell.Address.ColumnNumber;
                }

                if (ljsOrdCol == -1 || moduleCol == -1 || compositeCol == -1)
                {
                    return BadRequest("Required headers (LJS_ord, module, composite) not found in the first row.");
                }

                var modules = new List<ModuleList>();
                int lastRow = ws.LastRowUsed()!.RowNumber();

                for (int r = 2; r <= lastRow; r++)
                {
                    var row = ws.Row(r);
                    if (row.IsEmpty()) continue;

                    var ljsOrdText = row.Cell(ljsOrdCol).GetFormattedString().Trim();
                    var moduleText = row.Cell(moduleCol).GetFormattedString().Trim();
                    var compositeText = row.Cell(compositeCol).GetFormattedString().Trim();

                    if (string.IsNullOrEmpty(moduleText) && string.IsNullOrEmpty(compositeText)) 
                        continue;

                    if (!int.TryParse(ljsOrdText, out int ljsOrd))
                    {
                        ljsOrd = 0;
                    }

                    modules.Add(new ModuleList
                    {
                        LjsOrd = ljsOrd,
                        Module = moduleText,
                        Composite = compositeText
                    });
                }

                // Remove all existing modules and insert new ones
                _db.ModuleLists.RemoveRange(_db.ModuleLists);
                await _db.ModuleLists.AddRangeAsync(modules);
                await _db.SaveChangesAsync();

                return Ok(modules);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}

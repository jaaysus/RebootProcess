using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Controllers
{
    [ApiController]
    [Route("api/wiredata")]
    public class WireDataController : ControllerBase
    {
        private readonly AppDbContext _db;

        public WireDataController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.WireDatas.OrderBy(w => w.Id).ToListAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.WireDatas.FindAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        /// <summary>
        /// Lookup all wires connected to a given node name, enriched with EPN color data.
        /// Returns node name, epn, and per-cavity colors resolved from WireData (C1/C2).
        /// </summary>
        [HttpGet("node/{nodeName}")]
        // public async Task<IActionResult> GetByNode(string nodeName)
        // {
        //     var wires = await _db.WireDatas
        //         .Where(w => w.Node.ToLower() == nodeName.ToLower())
        //         .ToListAsync();

        //     if (!wires.Any())
        //         return NotFound(new { message = $"No wires found for node '{nodeName}'." });

        //     // Group by EPN
        //     var epnName = wires.First().Epn;
        //     var epn = await _db.Epns.FirstOrDefaultAsync(e => e.EpnCode == epnName);

        //     // Build cavity color map from wire data
        //     var cavityColors = new Dictionary<string, List<string>>();
        //     foreach (var wire in wires)
        //     {
        //         var cavKey = wire.Cavity.Trim();
        //         if (!cavityColors.ContainsKey(cavKey))
        //             cavityColors[cavKey] = new List<string>();
        //         // Encode C1 and C2 as color strings (front-end maps abbreviation → hex)
        //         if (!string.IsNullOrEmpty(wire.C1)) cavityColors[cavKey].Add(wire.C1);
        //         if (!string.IsNullOrEmpty(wire.C2)) cavityColors[cavKey].Add(wire.C2);
        //     }

        //     // Parse EPN coordinates JSON
        //     object? coordinatesObj = null;
        //     if (epn != null && !string.IsNullOrEmpty(epn.CoordinatesJson))
        //     {
        //         try
        //         {
        //             coordinatesObj = System.Text.Json.JsonSerializer.Deserialize<object>(epn.CoordinatesJson);
        //         }
        //         catch { }
        //     }

        //     var result = new
        //     {
        //         nodeName,
        //         epn = epnName,
        //         photo = epn?.Photo,
        //         epnId = epn?.Id,
        //         cavityCount = epn?.CavityCount ?? wires.First().TotalCav,
        //         needsCoordination = epn?.NeedsCoordination ?? true,
        //         coordinates = coordinatesObj,
        //         wires = wires.Select(w => new
        //         {
        //             w.Id,
        //             w.WireNumber,
        //             w.Csa,
        //             w.Length,
        //             w.C1,
        //             w.C2,
        //             w.Loc,
        //             w.Node,
        //             w.Epn,
        //             w.TotalCav,
        //             w.Cavity,
        //             w.Module,
        //             w.Station
        //         }),
        //         cavityColors
        //     };

        //     return Ok(result);
        // }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] WireData model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _db.WireDatas.Add(model);
            await _db.SaveChangesAsync();
            return Ok(model);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] WireData model)
        {
            if (id != model.Id)
                return BadRequest("ID mismatch");

            var existing = await _db.WireDatas.FindAsync(id);
            if (existing == null) return NotFound();

            existing.WireNumber = model.WireNumber;
            existing.Csa = model.Csa;
            existing.Length = model.Length;
            existing.C1 = model.C1;
            existing.C2 = model.C2;
            existing.Loc = model.Loc;
            existing.Node = model.Node;
            existing.Epn = model.Epn;
            existing.TotalCav = model.TotalCav;
            existing.Cavity = model.Cavity;
            existing.Module = model.Module;
            existing.Station = model.Station;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _db.WireDatas.FindAsync(id);
            if (existing == null) return NotFound();

            _db.WireDatas.Remove(existing);
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

                // Map header names to column indices
                var headerMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                var firstRow = ws.Row(1);
                foreach (var cell in firstRow.CellsUsed())
                {
                    var text = cell.GetFormattedString().Trim()
                        .Replace(" ", "").Replace("_", "").ToLower();
                    headerMap[text] = cell.Address.ColumnNumber;
                }

                int Col(params string[] names)
                {
                    foreach (var n in names)
                        if (headerMap.TryGetValue(n.Replace(" ", "").Replace("_", "").ToLower(), out int c))
                            return c;
                    return -1;
                }

                int wireNbCol    = Col("WireNb", "Wire Nb", "WireNumber");
                int csaCol       = Col("csa");
                int lengthCol    = Col("length");
                int c1Col        = Col("C1");
                int c2Col        = Col("C2");
                int locCol       = Col("Loc");
                int nodeCol      = Col("Node");
                int epnCol       = Col("EPN");
                int totalCavCol  = Col("TotalCav", "Total cav", "Totalcav");
                int cavityCol    = Col("Cavity");
                int moduleCol    = Col("Module");
                int stationCol   = Col("Station");

                if (wireNbCol == -1 || epnCol == -1)
                    return BadRequest("Required headers (Wire Nb, EPN) not found in the first row.");

                var wires = new List<WireData>();
                int lastRow = ws.LastRowUsed()!.RowNumber();

                for (int r = 2; r <= lastRow; r++)
                {
                    var row = ws.Row(r);
                    if (row.IsEmpty()) continue;

                    string GetText(int col) => col > 0
                        ? row.Cell(col).GetFormattedString().Trim()
                        : "";
                    double GetDouble(int col) => double.TryParse(GetText(col), out double v) ? v : 0;
                    int GetInt(int col) => int.TryParse(GetText(col), out int v) ? v : 0;

                    var wireNb = GetText(wireNbCol);
                    if (string.IsNullOrEmpty(wireNb)) continue;

                    wires.Add(new WireData
                    {
                        WireNumber = wireNb,
                        Csa        = GetDouble(csaCol),
                        Length     = GetDouble(lengthCol),
                        C1         = GetText(c1Col),
                        C2         = GetText(c2Col),
                        Loc        = GetText(locCol),
                        Node       = GetText(nodeCol),
                        Epn        = GetText(epnCol),
                        TotalCav   = GetInt(totalCavCol),
                        Cavity     = GetText(cavityCol),
                        Module     = GetText(moduleCol),
                        Station    = GetText(stationCol),
                    });
                }

                // Overwrite all existing wire data
                _db.WireDatas.RemoveRange(_db.WireDatas);
                await _db.WireDatas.AddRangeAsync(wires);
                await _db.SaveChangesAsync();

                return Ok(wires);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}

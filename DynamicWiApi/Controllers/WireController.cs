using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using DynamicWiApi.Services;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/wire")]
public class WireController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly HarnessImportService _importService;
    private readonly HarnessGraphService _graph;

    public WireController(AppDbContext db, HarnessImportService importService, HarnessGraphService graph)
    {
        _db = db;
        _importService = importService;
        _graph = graph;
    }

    private static object MapEnd(WireEnd e) => new
    {
        id = e.Id,
        node = e.Node.Name,
        cavity = e.Cavity,
        location = e.Location,
        station = e.Station,
        isSpliceCavity = e.IsSpliceCavity
    };

    private static object MapWire(Wire w) => new
    {
        id = w.Id,
        wireNumber = w.WireNumber,
        csa = w.Csa,
        length = w.Length,
        core = w.Core,
        colorC1 = w.ColorC1,
        colorC2 = w.ColorC2,
        module = w.Module,
        spliceCode = w.SpliceCode,
        ends = w.Ends.Select(MapEnd)
    };

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? page = null, 
        [FromQuery] int? pageSize = null,
        [FromQuery] string? wireNumber = null,
        [FromQuery] string? core = null,
        [FromQuery] string? module = null,
        [FromQuery] string? spliceCode = null,
        [FromQuery] string? station = null,
        [FromQuery] string? end1Node = null,
        [FromQuery] string? end2Node = null)
    {
        var query = _db.Wires
            .Include(w => w.Ends).ThenInclude(e => e.Node)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(wireNumber))
            query = query.Where(w => w.WireNumber != null && w.WireNumber.Contains(wireNumber));

        if (!string.IsNullOrWhiteSpace(core))
            query = query.Where(w => w.Core != null && w.Core.Contains(core));

        if (!string.IsNullOrWhiteSpace(module))
            query = query.Where(w => w.Module != null && w.Module.Contains(module));

        if (!string.IsNullOrWhiteSpace(spliceCode))
            query = query.Where(w => w.SpliceCode != null && w.SpliceCode.Contains(spliceCode));

        if (!string.IsNullOrWhiteSpace(station))
            query = query.Where(w => w.Ends.Any(e => e.Station != null && e.Station.Contains(station)));

        if (!string.IsNullOrWhiteSpace(end1Node))
            query = query.Where(w => w.Ends.Any(e => e.Node.Name.Contains(end1Node)));

        if (!string.IsNullOrWhiteSpace(end2Node))
            query = query.Where(w => w.Ends.Any(e => e.Node.Name.Contains(end2Node)));

        query = query.OrderBy(w => w.WireNumber);

        if (page.HasValue && pageSize.HasValue)
        {
            var totalCount = await query.CountAsync();
            var wires = await query
                .Skip((page.Value - 1) * pageSize.Value)
                .Take(pageSize.Value)
                .ToListAsync();

            return Ok(new
            {
                data = wires.Select(MapWire),
                totalCount = totalCount,
                page = page.Value,
                pageSize = pageSize.Value,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize.Value)
            });
        }
        else
        {
            var wires = await query.ToListAsync();
            return Ok(new { data = wires.Select(MapWire) });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var wire = await _db.Wires
            .Include(w => w.Ends).ThenInclude(e => e.Node)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (wire is null) return NotFound($"Wire {id} not found.");
        return Ok(new { data = MapWire(wire) });
    }

    /// <summary>
    /// A WireNumber isn't guaranteed unique across a whole harness dataset
    /// (only within the pair of rows that make up its two ends), so this
    /// returns every Wire that currently carries that number.
    /// </summary>
    [HttpGet("number/{wireNumber}")]
    public async Task<IActionResult> GetByNumber(string wireNumber)
    {
        var wires = await _db.Wires
            .Include(w => w.Ends).ThenInclude(e => e.Node)
            .Where(w => w.WireNumber == wireNumber)
            .ToListAsync();

        if (!wires.Any()) return NotFound($"No wire found with number '{wireNumber}'.");
        return Ok(new { data = wires.Select(MapWire) });
    }

    /// <summary>Every wire end sharing this wire's splice code — the n-way junction it sits at.</summary>
    [HttpGet("{id:int}/splice-group")]
    public async Task<IActionResult> GetSpliceGroup(int id)
    {
        var wire = await _db.Wires.FindAsync(id);
        if (wire is null) return NotFound($"Wire {id} not found.");

        if (string.IsNullOrWhiteSpace(wire.SpliceCode))
            return Ok(new { spliceCode = (string?)null, ends = Array.Empty<object>() });

        var ends = await _graph.GetSpliceGroupAsync(wire.SpliceCode);
        return Ok(new { data = new { spliceCode = wire.SpliceCode, ends = ends.Select(MapEnd) } });
    }

    /// <summary>
    /// Full BFS reachability from a wire end across wire-hops and splice-hops
    /// — everywhere this signal net eventually goes. Equivalent to
    /// resolveFromLeg in the HTML tool.
    /// </summary>
    [HttpGet("end/{wireEndId:int}/reachable")]
    public async Task<IActionResult> GetReachable(int wireEndId)
    {
        var exists = await _db.WireEnds.AnyAsync(e => e.Id == wireEndId);
        if (!exists) return NotFound($"Wire end {wireEndId} not found.");

        var reachable = await _graph.ResolveReachableAsync(wireEndId);

        return Ok(new { data = reachable.Select(r => new
        {
            wireEndId = r.End.Id,
            node = r.End.Node.Name,
            cavity = r.End.Cavity,
            station = r.End.Station,
            wireNumber = r.End.Wire.WireNumber,
            viaSplice = r.ViaSplice
        }) });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAll()
    {
        _db.WireEnds.RemoveRange(_db.WireEnds);
        _db.Wires.RemoveRange(_db.Wires);
        await _db.SaveChangesAsync();
        return Ok(new { message = "All wire data deleted successfully." });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var wire = await _db.Wires.FindAsync(id);
        if (wire is null) return NotFound($"Wire {id} not found.");

        _db.Wires.Remove(wire); // cascades to WireEnds
        await _db.SaveChangesAsync();
        return NoContent();
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

            int wireNbCol = Col("WireNb", "Wire Nb", "WireNumber");
            int coreCol = Col("Core", "CORE");
            int csaCol = Col("CSA", "csa");
            int lengthCol = Col("Length", "length");
            int c1Col = Col("C1");
            int c2Col = Col("C2");
            int locCol = Col("LOCATION", "Loc");
            int nodeCol = Col("Node");
            int epnCol = Col("EPN", "EpnNod", "EPN NOD");
            int cavityCol = Col("Cav", "Cavity");
            int spliceCol = Col("ST+SPLICE", "Splice");
            int moduleCol = Col("Options", "Module");
            int stationCol = Col("Station");

            if (wireNbCol == -1 || epnCol == -1)
                return BadRequest("Required headers (Wire Nb, EPN) not found in the first row.");

            var rows = new List<ParsedWireRow>();
            int lastRow = ws.LastRowUsed()!.RowNumber();

            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (row.IsEmpty()) continue;

                string GetText(int col) => col > 0 ? row.Cell(col).GetFormattedString().Trim() : "";
                double GetDouble(int col) => double.TryParse(GetText(col), out double v) ? v : 0;

                var wireNb = GetText(wireNbCol);
                if (string.IsNullOrEmpty(wireNb)) continue;

                rows.Add(new ParsedWireRow
                {
                    WireNumber = wireNb,
                    Core = GetText(coreCol),
                    Csa = GetDouble(csaCol),
                    Length = GetDouble(lengthCol),
                    C1 = GetText(c1Col),
                    C2 = GetText(c2Col),
                    Location = GetText(locCol),
                    NodeName = GetText(nodeCol),
                    EpnCode = GetText(epnCol),
                    Cavity = GetText(cavityCol),
                    Splice = GetText(spliceCol),
                    Module = GetText(moduleCol),
                    Station = GetText(stationCol),
                });
            }

            var wires = await _importService.ImportAsync(rows);

            return Ok(new { WireCount = wires.Count, EndCount = wires.Sum(w => w.Ends.Count) });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}

using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Services;

/// <summary>One raw row read from the wire-table spreadsheet, before grouping.</summary>
public class ParsedWireRow
{
    public string WireNumber { get; set; } = "";
    public string Core { get; set; } = "";
    public double Csa { get; set; }
    public double Length { get; set; }
    public string C1 { get; set; } = "";
    public string C2 { get; set; } = "";
    public string Location { get; set; } = "";
    public string NodeName { get; set; } = "";
    public string EpnCode { get; set; } = "";
    public string Cavity { get; set; } = "";
    public string Splice { get; set; } = "";
    public string Module { get; set; } = "";
    public string Station { get; set; } = "";
}

/// <summary>
/// Builds the normalized Node/Wire/WireEnd graph from flat spreadsheet rows.
/// Rows sharing the same WireNumber become the 1-2 ends of one Wire.
/// </summary>
public class HarnessImportService
{
    private readonly AppDbContext _db;

    public HarnessImportService(AppDbContext db) => _db = db;

    public async Task<List<Wire>> ImportAsync(List<ParsedWireRow> rows)
    {
        // Wipe existing harness data for this dataset (mirrors the old
        // "overwrite all" behavior — swap for a HarnessId scope if you
        // want versioned imports instead).
        _db.WireEnds.RemoveRange(_db.WireEnds);
        _db.Wires.RemoveRange(_db.Wires);
        await _db.SaveChangesAsync();

        var epnCache = await _db.Epns.ToDictionaryAsync(e => e.EpnCode, e => e);
        var nodeCache = await _db.Nodes.ToDictionaryAsync(n => n.Name, n => n);

        var wires = new List<Wire>();

        foreach (var group in rows.GroupBy(r => r.WireNumber))
        {
            var first = group.First();

            var wire = new Wire
            {
                WireNumber = first.WireNumber,
                Csa = first.Csa,
                Length = first.Length,
                Core = first.Core,
                ColorC1 = first.C1,
                ColorC2 = first.C2,
                Module = first.Module,
                SpliceCode = string.IsNullOrWhiteSpace(first.Splice) ? null : first.Splice,
            };

            foreach (var row in group) // 1 row = 1 end; usually 1-2 per WireNumber
            {
                var node = GetOrCreateNode(row.NodeName, row.EpnCode, row.Station, epnCache, nodeCache);

                wire.Ends.Add(new WireEnd
                {
                    Node = node,
                    Cavity = row.Cavity,
                    Location = row.Location,
                    Station = row.Station,
                });
            }

            wires.Add(wire);
        }

        _db.Wires.AddRange(wires);
        await _db.SaveChangesAsync();

        return wires;
    }

    private Node GetOrCreateNode(
        string nodeName,
        string epnCode,
        string station,
        Dictionary<string, Epn> epnCache,
        Dictionary<string, Node> nodeCache)
    {
        if (nodeCache.TryGetValue(nodeName, out var existing))
            return existing;

        if (!epnCache.TryGetValue(epnCode, out var epn))
        {
            // No EPN row yet (photo/cavity layout hasn't been coordinated) —
            // create a placeholder, same convention EpnsController already
            // uses via NeedsCoordination.
            epn = new Epn
            {
                EpnCode = epnCode,
                CavityCount = 0,
                NeedsCoordination = true,
            };
            _db.Epns.Add(epn);
            epnCache[epnCode] = epn;
        }

        var node = new Node
        {
            Name = nodeName,
            Epn = epn,
            Station = station,
        };
        _db.Nodes.Add(node);
        nodeCache[nodeName] = node;
        return node;
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Services;

namespace DynamicWiApi.Controllers;

[ApiController]
[Route("api/node")]
public class NodeController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly HarnessGraphService _graph;

    public NodeController(AppDbContext db, HarnessGraphService graph)
    {
        _db = db;
        _graph = graph;
    }

    /// <summary>
    /// Get all nodes, optionally filtered by station.
    /// </summary>
    /// <param name="station">Optional station filter (e.g., "Cellule 1")</param>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? station = null)
    {
        var query = _db.Nodes
            .Include(n => n.Epn)
            .AsQueryable();

        // Apply station filter if provided
        if (!string.IsNullOrWhiteSpace(station))
            query = query.Where(n => n.Station != null && n.Station.ToLower() == station.ToLower());

        var nodes = await query
            .OrderBy(n => n.Name)
            .ToListAsync();

        return Ok(nodes.Select(n => new
        {
            n.Id,
            n.Name,
            n.Station,
            Epn = n.Epn.EpnCode
        }));
    }

    /// <summary>
    /// Node detail: cavity layout (for the connector photo overlay) and,
    /// per cavity, the colors of whatever wires terminate there.
    /// Replaces the old WireDataController.GetByNode.
    /// </summary>
    [HttpGet("{name}")]
    public async Task<IActionResult> GetByName(string name)
    {
        var node = await _db.Nodes
            .Include(n => n.Epn).ThenInclude(e => e.Cavities)
            .Include(n => n.Epn).ThenInclude(e => e.Photo)
            .FirstOrDefaultAsync(n => n.Name.ToLower() == name.ToLower());

        if (node is null)
            return NotFound($"No node named '{name}'.");

        var ends = await _db.WireEnds
            .Where(e => e.NodeId == node.Id)
            .Include(e => e.Wire)
            .OrderBy(e => e.Cavity)
            .ToListAsync();

        var coordinates = node.Epn.Cavities is { Count: > 0 }
            ? node.Epn.Cavities
                .OrderBy(c => c.CavityNumber)
                .ToDictionary(
                    c => c.CavityNumber.ToString(),
                    c => new { c.X, c.Y, c.Size, c.Shape })
            : null;

        return Ok(new
        {
            node.Id,
            Name = node.Name,
            Epn = node.Epn.EpnCode,
            EpnId = node.EpnId,
            Photo = node.Epn.Photo,
            CavityCount = node.Epn.CavityCount,
            NeedsCoordination = node.Epn.NeedsCoordination,
            coordinates,
            Wires = ends.Select(e => new
            {
                e.Id,
                e.Wire.WireNumber,
                e.Wire.Core,
                e.Wire.Csa,
                e.Wire.Length,
                e.Wire.ColorC1,
                e.Wire.ColorC2,
                e.Location,
                Cavity = e.Cavity,
                e.IsSpliceCavity,
                e.Wire.SpliceCode,
                e.Wire.Module,
                e.Station
            })
        });
    }

    /// <summary>
    /// For every wire leaving this node, resolves the direct partner end.
    /// If that partner sits at a splice, it's expanded to the real connectors
    /// beyond it instead of being shown as a dead end — mirrors the destMap
    /// grouping in renderConnectorView (a splice is never mistaken for a
    /// single real connector).
    /// </summary>
    /// <param name="name">Node name</param>
    /// <param name="station">Optional station filter for the connections</param>
    [HttpGet("{name}/connections")]
    public async Task<IActionResult> GetConnections(string name, [FromQuery] string? station = null)
    {
        var node = await _db.Nodes.FirstOrDefaultAsync(n => n.Name.ToLower() == name.ToLower());
        if (node is null)
            return NotFound($"No node named '{name}'.");

        var ends = await _db.WireEnds
            .Where(e => e.NodeId == node.Id)
            .Include(e => e.Wire)
            .OrderBy(e => e.Cavity)
            .ToListAsync();

        var destinations = new List<object>();

        foreach (var end in ends)
        {
            var partner = await _graph.GetDirectPartnerAsync(end.Id);
            if (partner is null)
            {
                destinations.Add(new
                {
                    SourceCavity = end.Cavity,
                    Wire = end.Wire.WireNumber,
                    IsTerminal = true
                });
                continue;
            }

            if (partner.IsSpliceCavity)
            {
                var reaches = await _graph.BeyondSpliceAsync(partner.Id);
                
                // Filter reaches by station if specified
                var filteredReaches = reaches;
                if (!string.IsNullOrWhiteSpace(station))
                {
                    filteredReaches = reaches
                        .Where(r => r.Station != null && r.Station.ToLower() == station.ToLower())
                        .ToList();
                }

                destinations.Add(new
                {
                    SourceCavity = end.Cavity,
                    Wire = end.Wire.WireNumber,
                    IsSplice = true,
                    SpliceCode = partner.Wire.SpliceCode,
                    Reaches = filteredReaches.Select(r => new { Node = r.NodeName, Station = r.Station })
                });
            }
            else
            {
                // Filter partner by station if specified
                if (!string.IsNullOrWhiteSpace(station))
                {
                    // Skip this connection if partner's station doesn't match
                    if (partner.Station == null || partner.Station.ToLower() != station.ToLower())
                        continue;
                }

                destinations.Add(new
                {
                    SourceCavity = end.Cavity,
                    Wire = end.Wire.WireNumber,
                    IsSplice = false,
                    Node = partner.Node.Name,
                    Cavity = partner.Cavity,
                    Station = partner.Station
                });
            }
        }

        return Ok(new { node = node.Name, destinations });
    }
}
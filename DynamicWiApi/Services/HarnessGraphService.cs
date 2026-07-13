using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Data;
using DynamicWiApi.Models;

namespace DynamicWiApi.Services;

/// <summary>
/// One entry in a reachability result: the end reached, and — if the hop
/// that reached it passed through a splice — which splice code it went
/// through. Mirrors the {leg, via} shape resolveFromLeg returns in the HTML.
/// </summary>
public record ReachableEnd(WireEnd End, string? ViaSplice);

/// <summary>
/// Replaces the HTML's index-based adjacency (byWire / bySplice / adj /
/// resolveFromLeg) with real queries over WireEnd/Wire. Two kinds of hop:
///   - "wire hop": the other WireEnd on the same Wire (was byWire).
///   - "splice hop": any other WireEnd whose Wire shares this end's
///     Wire.SpliceCode (was bySplice) — an n-way junction, not a pair.
/// </summary>
public class HarnessGraphService
{
    private readonly AppDbContext _db;

    public HarnessGraphService(AppDbContext db) => _db = db;

    /// <summary>
    /// The one-hop far end of THIS physical wire — the other WireEnd sharing
    /// the same WireId. Equivalent to directPartnerLeg. Null if this wire
    /// only has one end recorded (a true terminal).
    /// </summary>
    public async Task<WireEnd?> GetDirectPartnerAsync(int wireEndId)
    {
        var end = await _db.WireEnds
            .Include(e => e.Wire).ThenInclude(w => w.Ends).ThenInclude(e2 => e2.Node)
            .FirstOrDefaultAsync(e => e.Id == wireEndId);

        return end?.Wire.Ends.FirstOrDefault(e => e.Id != wireEndId);
    }

    /// <summary>Every WireEnd whose Wire shares the given splice code. Equivalent to bySplice[code].</summary>
    public async Task<List<WireEnd>> GetSpliceGroupAsync(string spliceCode)
    {
        if (string.IsNullOrWhiteSpace(spliceCode)) return new();

        return await _db.WireEnds
            .Include(e => e.Wire)
            .Include(e => e.Node)
            .Where(e => e.Wire.SpliceCode == spliceCode)
            .ToListAsync();
    }

    /// <summary>
    /// Full BFS from a starting WireEnd across wire-hops and splice-hops —
    /// equivalent to resolveFromLeg. Note: like the original client-side
    /// version, this currently loads the whole WireEnd table into memory to
    /// build adjacency; if that becomes a problem on a large harness, scope
    /// it to a station or module set first (see caveat in the controller).
    /// </summary>
    public async Task<List<ReachableEnd>> ResolveReachableAsync(int startWireEndId)
    {
        var allEnds = await _db.WireEnds
            .Include(e => e.Wire)
            .Include(e => e.Node)
            .ToListAsync();

        var byId = allEnds.ToDictionary(e => e.Id);
        if (!byId.ContainsKey(startWireEndId)) return new();

        var byWireId = allEnds.GroupBy(e => e.WireId).ToDictionary(g => g.Key, g => g.ToList());
        var bySplice = allEnds
            .Where(e => !string.IsNullOrWhiteSpace(e.Wire.SpliceCode))
            .GroupBy(e => e.Wire.SpliceCode!)
            .ToDictionary(g => g.Key, g => g.ToList());

        var visited = new HashSet<int> { startWireEndId };
        var queue = new Queue<(int Id, string? Via)>();
        queue.Enqueue((startWireEndId, null));

        var results = new List<ReachableEnd>();

        while (queue.Count > 0)
        {
            var (currentId, via) = queue.Dequeue();
            var current = byId[currentId];

            // wire hop
            foreach (var partner in byWireId[current.WireId])
            {
                if (partner.Id == currentId || visited.Contains(partner.Id)) continue;
                visited.Add(partner.Id);
                results.Add(new ReachableEnd(partner, via));
                queue.Enqueue((partner.Id, via));
            }

            // splice hop — every other end sharing this wire's splice code
            var spliceCode = current.Wire.SpliceCode;
            if (!string.IsNullOrWhiteSpace(spliceCode) && bySplice.TryGetValue(spliceCode, out var group))
            {
                foreach (var peer in group)
                {
                    if (peer.Id == currentId || visited.Contains(peer.Id)) continue;
                    visited.Add(peer.Id);
                    results.Add(new ReachableEnd(peer, spliceCode));
                    queue.Enqueue((peer.Id, spliceCode));
                }
            }
        }

        return results;
    }

    /// <summary>
    /// From an end sitting at a splice pseudo-cavity, the real connectors
    /// (non-splice-cavity ends) reachable beyond it, deduped by Node name.
    /// Equivalent to beyondSplice.
    /// </summary>
    public async Task<List<(string NodeName, string Station)>> BeyondSpliceAsync(int spliceWireEndId)
    {
        var reachable = await ResolveReachableAsync(spliceWireEndId);

        var seen = new Dictionary<string, string>();
        foreach (var r in reachable)
        {
            if (r.End.IsSpliceCavity) continue;
            if (!seen.ContainsKey(r.End.Node.Name))
                seen[r.End.Node.Name] = string.IsNullOrWhiteSpace(r.End.Station) ? "Unknown" : r.End.Station;
        }

        return seen.Select(kv => (kv.Key, kv.Value)).ToList();
    }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models;

/// <summary>
/// A physical connector instance in the harness, e.g. "C1MA74A".
/// Every Node is built from one Epn housing type, which supplies the
/// cavity count and cavity photo layout (EpnCavity). Multiple Nodes can
/// (and usually do) share the same Epn — e.g. every "KIT-132" connector
/// used across the harness points at the same Epn row.
/// </summary>
public class Node
{
    public int Id { get; set; }

    /// <summary>The connector instance name as it appears in the wire table's "Node" column.</summary>
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int EpnId { get; set; }

    [ForeignKey(nameof(EpnId))]
    public Epn Epn { get; set; } = null!;

    /// <summary>Station/cell this connector physically lives in (e.g. "Cellule 1").</summary>
    [MaxLength(100)]
    public string? Station { get; set; }

    public ICollection<WireEnd> Ends { get; set; } = new List<WireEnd>();
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models;

/// <summary>
/// One termination of a Wire: which Node it plugs into, and which cavity
/// of that Node's connector. This is the row that gives a cavity its color
/// (via Wire.ColorC1/ColorC2) when rendering the connector diagram.
/// </summary>
public class WireEnd
{
    public int Id { get; set; }

    [Required]
    public int WireId { get; set; }

    [ForeignKey(nameof(WireId))]
    public Wire Wire { get; set; } = null!;

    [Required]
    public int NodeId { get; set; }

    [ForeignKey(nameof(NodeId))]
    public Node Node { get; set; } = null!;

    /// <summary>
    /// Cavity number within the Node's Epn. Kept as string, not int, because
    /// splice/weld pseudo-cavities use letter codes ("L", "R") instead of a
    /// real numbered cavity — see IsSpliceCavity below.
    /// </summary>
    [Required, MaxLength(20)]
    public string Cavity { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Station { get; set; } = string.Empty;

    /// <summary>
    /// True when this end sits at a splice/weld pseudo-cavity rather than a
    /// real numbered cavity on a connector. Mirrors the frontend's
    /// isSpliceCavity(cav) check exactly (cavity code "L" or "R").
    /// Not mapped to a column — it's derived purely from Cavity.
    /// </summary>
    [NotMapped]
    public bool IsSpliceCavity =>
        Cavity.Trim().Equals("L", StringComparison.OrdinalIgnoreCase) ||
        Cavity.Trim().Equals("R", StringComparison.OrdinalIgnoreCase);
}
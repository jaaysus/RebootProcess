using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;

public class Epn
{
    public int Id { get; set; }

    public string EpnCode { get; set; } = "";

    public int CavityCount { get; set; }

    public EpnPhoto? Photo { get; set; }

    public ICollection<EpnCavity> Cavities { get; set; }
        = new List<EpnCavity>();

    // NEW: every physical connector instance built from this housing type.
    public ICollection<Node> Nodes { get; set; }
        = new List<Node>();

    public bool NeedsCoordination { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace DynamicWiApi.Models;
public class EpnPhoto
{
    public int Id { get; set; }

    public string FilePath { get; set; } = "";

    public int PhotoWidth { get; set; }

    public int PhotoHeight { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Epn> Epns { get; set; }
        = new List<Epn>();
}
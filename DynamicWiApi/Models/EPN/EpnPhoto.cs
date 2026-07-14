using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models;

public class EpnPhoto
{
    public int Id { get; set; }

    public string EpnCode { get; set; } = "";

    public string FilePath { get; set; } = "";

    public int PhotoWidth { get; set; }

    public int PhotoHeight { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public string Epn => Path.GetFileNameWithoutExtension(FilePath);

    public ICollection<Epn> Epns { get; set; }
        = new List<Epn>();
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DynamicWiApi.Models
{
    public class ModuleList
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        public Guid? UploadedBy { get; set; }

        [ForeignKey("UploadedBy")]
        public User? Uploader { get; set; }

        public ICollection<ModuleListEntry> Entries { get; set; } = new List<ModuleListEntry>();
    }
}
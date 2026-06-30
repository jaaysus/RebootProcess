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

        [Required]
        public string FileContent { get; set; } = string.Empty;

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;

        public Guid? UploadedBy { get; set; }

        // Navigation property for the user who uploaded the file
        [ForeignKey("UploadedBy")]
        public User? Uploader { get; set; }
    }
}

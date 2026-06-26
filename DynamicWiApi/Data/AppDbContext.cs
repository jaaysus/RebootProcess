using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Models;

namespace DynamicWiApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Operator> Operators => Set<Operator>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ModuleList> ModuleLists => Set<ModuleList>();
    public DbSet<WireData> WireDatas => Set<WireData>();

    public DbSet<Epn> Epns => Set<Epn>();
    public DbSet<EpnPhoto> EpnPhotos => Set<EpnPhoto>();
    public DbSet<EpnCavity> EpnCavities => Set<EpnCavity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Operator>()
            .HasIndex(o => o.Badge)
            .IsUnique();

        modelBuilder.Entity<Operator>()
            .Property(o => o.QrCodeImage)
            .HasColumnType("varbinary(max)");

        modelBuilder.Entity<Epn>()
            .HasIndex(e => e.EpnCode)
            .IsUnique();

        modelBuilder.Entity<Epn>()
            .HasMany(e => e.Cavities)
            .WithOne()
            .HasForeignKey(c => c.EpnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Epn>()
            .HasOne(e => e.Photo)
            .WithMany(p => p.Epns)
            .HasForeignKey(e => e.PhotoId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
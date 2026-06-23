using Microsoft.EntityFrameworkCore;
using DynamicWiApi.Models;

namespace DynamicWiApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();

    public DbSet<Operator> Operators => Set<Operator>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Operator>()
            .HasIndex(o => o.Badge)
            .IsUnique();

        modelBuilder.Entity<Operator>()
            .Property(o => o.QrCodeImage)
            .HasColumnType("varbinary(max)");
    }
    public DbSet<Connector> Connectors => Set<Connector>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<HarnessProject> HarnessProjects => Set<HarnessProject>();
    public DbSet<ProcessExcelData> ProcessExcelData => Set<ProcessExcelData>();
    public DbSet<ModuleList> ModuleLists => Set<ModuleList>();
    public DbSet<WireData> WireDatas => Set<WireData>();
    public DbSet<EpnInfo> EpnInfos => Set<EpnInfo>();
}

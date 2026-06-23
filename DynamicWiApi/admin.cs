using System.Text;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DynamicWiApi.CLI;

public static class AdminCli
{
    public static async Task HandleAsync(string[] args, AppDbContext db)
    {
        if (args.Length == 0 || args[0].ToLower() != "admin")
            return;

        var admins = await db.Users
            .Where(u => u.Role == Roles.Admin)
            .OrderBy(u => u.FullName)
            .ToListAsync();

        if (!admins.Any())
        {
            Console.WriteLine("❌ No admins found.");
            return;
        }

        Console.WriteLine("=== ADMINS ===");

        for (int i = 0; i < admins.Count; i++)
        {
            var admin = admins[i];

            Console.WriteLine(
                $"{i + 1}. {admin.FullName} | {admin.Email} | Approved: {admin.IsApproved}");
        }

        int adminIndex;

        while (true)
        {
            Console.Write("Select Admin: ");

            if (int.TryParse(Console.ReadLine(), out adminIndex) &&
                adminIndex >= 1 &&
                adminIndex <= admins.Count)
            {
                break;
            }

            Console.WriteLine("Invalid selection.");
        }

        var selectedAdmin = admins[adminIndex - 1];

        Console.WriteLine();
        Console.WriteLine($"Selected: {selectedAdmin.FullName}");
        Console.WriteLine("1. Approve");
        Console.WriteLine("2. Reset Password");

        int action;

        while (true)
        {
            Console.Write("Choose action: ");

            if (int.TryParse(Console.ReadLine(), out action) &&
                (action == 1 || action == 2))
            {
                break;
            }

            Console.WriteLine("Invalid selection.");
        }

        switch (action)
        {
            case 1:
                selectedAdmin.IsApproved = true;
                selectedAdmin.ApprovedAt = DateTime.UtcNow;

                await db.SaveChangesAsync();

                Console.WriteLine(
                    $"✅ {selectedAdmin.FullName} approved successfully.");
                break;

            case 2:
                Console.Write("New Password: ");

                var password = ReadPassword();

                if (string.IsNullOrWhiteSpace(password))
                {
                    Console.WriteLine("❌ Password cannot be empty.");
                    return;
                }

                selectedAdmin.PasswordHash =
                    User.HashPassword(password);

                await db.SaveChangesAsync();

                Console.WriteLine(
                    $"✅ Password reset successfully for {selectedAdmin.FullName}.");
                break;
        }
    }

    private static string ReadPassword()
    {
        var password = new StringBuilder();
        ConsoleKeyInfo key;

        while ((key = Console.ReadKey(true)).Key != ConsoleKey.Enter)
        {
            if (key.Key == ConsoleKey.Backspace && password.Length > 0)
            {
                password.Remove(password.Length - 1, 1);
                Console.Write("\b \b");
            }
            else if (!char.IsControl(key.KeyChar))
            {
                password.Append(key.KeyChar);
                Console.Write("*");
            }
        }

        Console.WriteLine();
        return password.ToString();
    }
}
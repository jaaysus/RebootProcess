using System.Text;
using DynamicWiApi.Data;
using DynamicWiApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DynamicWiApi.CLI;

public static class UserCli
{

    private static readonly string[] AvailableRoles = new[]
    {
        Roles.Admin,
        Roles.ProcessTechnician
    };

    public static async Task HandleAsync(string[] args, AppDbContext db)
    {
        if (args.Length == 0 || args[0].ToLower() != "add-user")
            return;

        Console.WriteLine("➤ Creating a new system user (Admin / Process Technician)...");

        // 1️⃣ Badge
        string badge;
        do
        {
            Console.Write("Enter Badge: ");
            badge = Console.ReadLine()!.Trim();
        } while (string.IsNullOrEmpty(badge));

        // 2️⃣ Full Name
        string fullName;
        do
        {
            Console.Write("Enter Full Name: ");
            fullName = Console.ReadLine()!.Trim();
        } while (string.IsNullOrEmpty(fullName));

        // 3️⃣ Email
        string email;
        do
        {
            Console.Write("Enter Email: ");
            email = Console.ReadLine()!.Trim();
        } while (string.IsNullOrEmpty(email));

        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            Console.WriteLine("❌ User with this email already exists.");
            return;
        }

        // 4️⃣ Password
        string password;
        do
        {
            Console.Write("Enter Password: ");
            password = ReadPassword();
        } while (string.IsNullOrEmpty(password));

        // 5️⃣ Role selection
        Console.WriteLine("Select Role:");
        for (int i = 0; i < AvailableRoles.Length; i++)
            Console.WriteLine($"{i + 1}. {AvailableRoles[i]}");

        int roleIndex;
        while (true)
        {
            Console.Write("Enter number of role: ");
            var input = Console.ReadLine();
            if (int.TryParse(input, out roleIndex) &&
                roleIndex >= 1 && roleIndex <= AvailableRoles.Length)
                break;
            Console.WriteLine("Invalid selection. Try again.");
        }

        var role = AvailableRoles[roleIndex - 1];

        // ✅ Create system user
        var user = new User
        {
            FullName = fullName,
            Email = email,
            Role = role,
            PasswordHash = User.HashPassword(password)
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        Console.WriteLine($"✅ User {email} created successfully with role {role}.");
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

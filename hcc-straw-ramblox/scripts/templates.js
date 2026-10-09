/**
 * Ramblox Scripting API
 * 
 * Example script templates for Roblox games
 */

// Basic Script Template
export const basicScript = `
-- Basic game script
local Players = game:GetService("Players")

local function onPlayerJoin(player)
    print(player.Name .. " joined the game!")
end

Players.PlayerAdded:Connect(onPlayerJoin)
`;

// Leaderboard Template
export const leaderboardScript = `
-- Leaderboard system
local Leaderstats = {}

game:GetService("Players").PlayerAdded:Connect(function(player)
    local leaderstats = Instance.New("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local score = Instance.New("IntValue")
    score.Name = "Score"
    score.Value = 0
    score.Parent = leaderstats
end)
`;

// Currency System Template
export const currencyScript = `
-- In-game currency system
local CurrencyService = {}

function CurrencyService.createCurrency(player, currencyName, startingAmount)
    local currency = Instance.New("IntValue")
    currency.Name = currencyName
    currency.Value = startingAmount or 0
    currency.Parent = player:FindFirstChild("leaderstats")
    return currency
end

function CurrencyService.addCurrency(player, currencyName, amount)
    local currency = player:FindFirstChild("leaderstats"):FindFirstChild(currencyName)
    if currency then
        currency.Value = currency.Value + amount
    end
end

return CurrencyService
`;

// Teleport System Template
export const teleportScript = `
-- Teleport system
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local teleportLocations = {
    { Name = "Hub", Position = Vector3.new(0, 10, 0) },
    { Name = "Arena", Position = Vector3.new(100, 20, 0) },
    { Name = "Shop", Position = Vector3.new(-100, 15, 0) },
}

local function teleportToLocation(player, locationName)
    local location = teleportLocations:FindFirstWhere(function(loc)
        return loc.Name == locationName
    end)
    
    if location then
        local character = player.Character
        if character and character:FindFirstChild("HumanoidRootPart") then
            character.HumanoidRootPart.CFrame = CFrame.new(location.Position)
        end
    end
end

return { teleportToLocation = teleportToLocation, Locations = teleportLocations }
`;

return {
  basic: basicScript,
  leaderboard: leaderboardScript,
  currency: currencyScript,
  teleport: teleportScript,
};

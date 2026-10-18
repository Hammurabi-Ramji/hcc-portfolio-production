-- Teleport System
local TeleportService = game:GetService("TeleportService")
local locations = {
    { Name = "Hub", Position = Vector3.new(0, 10, 0) },
    { Name = "Arena", Position = Vector3.new(100, 20, 0) }
}
function teleportToLocation(player, locationName)
    local loc = locations:FindFirstWhere(function(l) return l.Name == locationName end)
    if loc and player.Character then
        player.Character:FindFirstChild("HumanoidRootPart").CFrame = CFrame.new(loc.Position)
    end
end
return { teleportToLocation = teleportToLocation }

-- Leaderboard System
game:GetService("Players").PlayerAdded:Connect(function(player)
    local leaderstats = Instance.New("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local score = Instance.New("IntValue")
    score.Name = "Score"
    score.Value = 0
    score.Parent = leaderstats
end)

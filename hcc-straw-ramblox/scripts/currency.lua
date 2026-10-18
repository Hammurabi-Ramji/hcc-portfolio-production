-- Currency System
local CurrencyService = {}
function CurrencyService.createCurrency(player, name, amount)
    local currency = Instance.New("IntValue")
    currency.Name = name
    currency.Value = amount or 0
    currency.Parent = player:FindFirstChild("leaderstats")
    return currency
end
return CurrencyService

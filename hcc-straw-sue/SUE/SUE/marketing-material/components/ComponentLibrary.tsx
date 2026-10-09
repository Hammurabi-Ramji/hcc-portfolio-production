import NeonCard from "@/components/NeonCard";
import NeonButton from "@/components/NeonButton";
import ActionButtons from "@/components/ActionButtons";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function ComponentLibrary() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold text-white">Component Library</h1>
        <p className="text-muted-foreground">All reusable UI components for SUE AI Sidebar</p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Buttons</h2>
        <NeonCard accentColor="cyan">
          <div className="space-y-6">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Primary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <NeonButton variant="primary" accentColor="cyan">
                  Cyan Button
                </NeonButton>
                <NeonButton variant="primary" accentColor="magenta">
                  Magenta Button
                </NeonButton>
                <NeonButton variant="primary" accentColor="purple">
                  Purple Button
                </NeonButton>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Secondary Buttons */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Secondary Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <NeonButton variant="secondary" accentColor="cyan">
                  Secondary Cyan
                </NeonButton>
                <NeonButton variant="secondary" accentColor="magenta">
                  Secondary Magenta
                </NeonButton>
                <NeonButton variant="secondary" accentColor="purple">
                  Secondary Purple
                </NeonButton>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Outline Buttons */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Outline Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <NeonButton variant="outline" accentColor="cyan">
                  Outline Cyan
                </NeonButton>
                <NeonButton variant="outline" accentColor="magenta">
                  Outline Magenta
                </NeonButton>
                <NeonButton variant="outline" accentColor="purple">
                  Outline Purple
                </NeonButton>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Button Sizes */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Button Sizes</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <NeonButton size="sm" variant="primary">
                  Small
                </NeonButton>
                <NeonButton size="md" variant="primary">
                  Medium
                </NeonButton>
                <NeonButton size="lg" variant="primary">
                  Large
                </NeonButton>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Full Width Button */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Full Width</h3>
              <NeonButton fullWidth variant="primary">
                Full Width Button
              </NeonButton>
            </div>
          </div>
        </NeonCard>
      </section>

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <NeonCard accentColor="cyan">
            <h3 className="text-lg font-display font-bold text-white mb-2">Cyan Card</h3>
            <p className="text-sm text-muted-foreground">
              This is a neon card with cyan accent color and glowing border effect.
            </p>
          </NeonCard>
          <NeonCard accentColor="magenta">
            <h3 className="text-lg font-display font-bold text-white mb-2">Magenta Card</h3>
            <p className="text-sm text-muted-foreground">
              This is a neon card with magenta accent color and glowing border effect.
            </p>
          </NeonCard>
          <NeonCard accentColor="purple">
            <h3 className="text-lg font-display font-bold text-white mb-2">Purple Card</h3>
            <p className="text-sm text-muted-foreground">
              This is a neon card with purple accent color and glowing border effect.
            </p>
          </NeonCard>
        </div>
      </section>

      {/* Form Elements Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Form Elements</h2>
        <NeonCard accentColor="purple">
          <div className="space-y-6">
            {/* Input */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Text Input</h3>
              <Input
                placeholder="Enter text here..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Separator className="bg-border" />

            {/* Textarea */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Textarea</h3>
              <Textarea
                placeholder="Enter your message here..."
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                rows={4}
              />
            </div>

            <Separator className="bg-border" />

            {/* Checkboxes */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Checkboxes</h3>
              <div className="space-y-3">
                {["Option 1", "Option 2", "Option 3"].map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Checkbox id={`check-${idx}`} />
                    <Label htmlFor={`check-${idx}`} className="text-foreground cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Radio Group */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Radio Group</h3>
              <RadioGroup defaultValue="option1">
                {["Option 1", "Option 2", "Option 3"].map((option, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <RadioGroupItem value={`option${idx + 1}`} id={`radio-${idx}`} />
                    <Label htmlFor={`radio-${idx}`} className="text-foreground cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator className="bg-border" />

            {/* Switch */}
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-3">Toggle Switch</h3>
              <div className="flex items-center gap-3">
                <Switch id="toggle" />
                <Label htmlFor="toggle" className="text-foreground cursor-pointer">
                  Enable feature
                </Label>
              </div>
            </div>
          </div>
        </NeonCard>
      </section>

      {/* Badges Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Badges</h2>
        <NeonCard accentColor="magenta">
          <div className="flex flex-wrap gap-3">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-cyan-600 text-white">Custom Cyan</Badge>
            <Badge className="bg-purple-600 text-white">Custom Purple</Badge>
          </div>
        </NeonCard>
      </section>

      {/* Action Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Action Buttons</h2>
        <NeonCard accentColor="cyan">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Quick action buttons for common SUE AI Sidebar operations:
            </p>
            <ActionButtons />
          </div>
        </NeonCard>
      </section>

      {/* Typography Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Typography</h2>
        <NeonCard accentColor="purple">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-display font-bold text-white mb-2">Heading 1</h1>
              <p className="text-xs text-muted-foreground">32px, Sora Bold</p>
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Heading 2</h2>
              <p className="text-xs text-muted-foreground">28px, Sora Bold</p>
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">Heading 3</h3>
              <p className="text-xs text-muted-foreground">24px, Sora Bold</p>
            </div>
            <div>
              <p className="text-base text-foreground mb-2">Body text - 16px, Inter Regular</p>
              <p className="text-xs text-muted-foreground">This is how regular body text looks in the UI.</p>
            </div>
            <div>
              <p className="text-sm text-foreground mb-2">Small text - 14px, Inter Regular</p>
              <p className="text-xs text-muted-foreground">This is smaller text for secondary information.</p>
            </div>
            <div>
              <code className="text-sm font-mono text-accent bg-secondary px-2 py-1 rounded">
                Code text - JetBrains Mono
              </code>
            </div>
          </div>
        </NeonCard>
      </section>

      {/* Color Palette Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-white">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Neon Cyan", color: "#00d9ff" },
            { name: "Neon Magenta", color: "#ff00ff" },
            { name: "Neon Purple", color: "#8b5cf6" },
            { name: "Dark BG", color: "#0f1419" },
            { name: "Dark Card", color: "#1a1f2e" },
            { name: "Dark Border", color: "#2d3748" },
            { name: "Text Primary", color: "#e5e7eb" },
            { name: "Text Muted", color: "#9ca3af" },
          ].map((item) => (
            <NeonCard key={item.name} accentColor="cyan" className="text-center">
              <div
                className="w-full h-20 rounded-lg mb-3 border border-border"
                style={{ backgroundColor: item.color }}
              />
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground font-mono">{item.color}</p>
            </NeonCard>
          ))}
        </div>
      </section>
    </div>
  );
}

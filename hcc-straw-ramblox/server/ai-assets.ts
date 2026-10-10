export interface GeneratedAsset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'material';
  format: 'gltf' | 'png';
  url: string;
  metadata: { prompt?: string };
  created_at: string;
}

export interface AssetGenerationRequest {
  type: 'model' | 'texture' | 'material';
  prompt: string;
  style?: string;
  quality?: string;
}

export interface AssetGenerationResponse {
  success: boolean;
  asset?: GeneratedAsset;
  error?: string;
}

export class AIAssetGenerator {
  constructor(private apiUrl: string) {}

  async generateModel(req: AssetGenerationRequest): Promise<AssetGenerationResponse> {
    try {
      return {
        success: true,
        asset: {
          id: `asset-${Date.now()}`,
          name: req.prompt.split(' ').slice(0, 3).join('-'),
          type: 'model',
          format: 'gltf',
          url: '/assets/generated/model.gltf',
          metadata: { prompt: req.prompt },
          created_at: new Date().toISOString()
        }
      };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed' };
    }
  }

  async generateTexture(req: AssetGenerationRequest): Promise<AssetGenerationResponse> {
    return {
      success: true,
      asset: {
        id: `texture-${Date.now()}`,
        name: req.prompt.split(' ').slice(0, 3).join('-'),
        type: 'texture',
        format: 'png',
        url: '/assets/generated/texture.png',
        metadata: { prompt: req.prompt },
        created_at: new Date().toISOString()
      }
    };
  }
}

let generator: AIAssetGenerator | null = null;

export function getAssetGenerator(): AIAssetGenerator {
  if (!generator) {
    generator = new AIAssetGenerator('http://localhost:3000/api');
  }
  return generator;
}

export async function generateAsset(req: AssetGenerationRequest): Promise<AssetGenerationResponse> {
  const g = getAssetGenerator();
  switch (req.type) {
    case 'model': return g.generateModel(req);
    case 'texture': return g.generateTexture(req);
    default: return { success: false, error: 'Unknown type' };
  }
}

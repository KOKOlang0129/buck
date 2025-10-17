export interface Scenario {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isPublic: boolean
  authorId: string
}

export interface UserProfile {
  id: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: Date
  isAllowed: boolean
}

// Mock AI suggestions
export const mockAISuggestions = [
  "主人公は立ち上がり、決意を込めて言った。",
  "その時、不思議な光が現れて、状況を一変させた。",
  "彼女の心に新しい希望が芽生え始めていた。",
  "謎めいた影が近づいてくる。",
  "突然、雷鳴が轟き、空が暗くなった。",
  "古い城の扉がきしみながら開いた。",
  "魔法の剣が光り始めた。",
  "風が物語を運んでくる。",
  "星が瞬いて、新しい冒険を予感させる。",
  "時間が止まったような静寂が訪れた。"
]

// Mock scenarios data
const mockScenarios: Scenario[] = [
  {
    id: '1',
    title: '冒険の始まり',
    content: `主人公のアレックスは小さな村で平凡な生活を送っていた。毎日同じような日々が続き、何か変化を求めていた。

ある朝、村の外れで不思議な光を発する石を発見した。その石に触れた瞬間、世界が一変した。

「これは...魔法の石？」アレックスは呟いた。

その時、石から声が聞こえてきた。「選ばれし者よ、君の冒険が今始まる...」`,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    tags: ['冒険', 'ファンタジー', '魔法'],
    isPublic: true,
    authorId: 'mock-user-id'
  },
  {
    id: '2',
    title: '謎の遺跡',
    content: `考古学者のサラは古代の遺跡で不思議な発見をした。壁に刻まれた文字は、これまで見たことのない言語だった。

「この文字...古代エジプトとも、マヤ文明とも違う」サラは顕微鏡で文字を詳しく調べた。

突然、遺跡の奥から光が差し込んだ。それは自然光ではない。人工的な光だった。

「誰かいるのか？」サラは懐中電灯を手に取り、光の方向へ歩き始めた。`,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    tags: ['ミステリー', '古代', '考古学'],
    isPublic: false,
    authorId: 'mock-user-id'
  },
  {
    id: '3',
    title: '宇宙の旅人',
    content: `宇宙船パイオニア号は未知の惑星に向かっていた。船長のケンは地球を離れてから3年が経過していた。

「地球からの最後の通信から6ヶ月が経った」ケンは航海日誌に記録した。

その時、船の警報システムが作動した。「未知の物体が接近中」という警告音が響いた。

ケンはスクリーンを見つめた。そこには、これまで見たことのない巨大な宇宙船が映し出されていた。`,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
    tags: ['SF', '宇宙', '冒険'],
    isPublic: true,
    authorId: 'mock-user-id'
  }
]

class MockDataService {
  private scenarios: Scenario[] = [...mockScenarios]

  // Get all scenarios for a user
  getUserScenarios(userId: string): Scenario[] {
    return this.scenarios.filter(s => s.authorId === userId)
  }

  // Get a specific scenario
  getScenario(id: string): Scenario | null {
    return this.scenarios.find(s => s.id === id) || null
  }

  // Create a new scenario
  createScenario(scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): string {
    const newScenario: Scenario = {
      ...scenario,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.scenarios.push(newScenario)
    this.saveToLocalStorage()
    return newScenario.id
  }

  // Update a scenario
  updateScenario(id: string, updates: Partial<Scenario>): void {
    const index = this.scenarios.findIndex(s => s.id === id)
    if (index !== -1) {
      this.scenarios[index] = {
        ...this.scenarios[index],
        ...updates,
        updatedAt: new Date()
      }
      this.saveToLocalStorage()
    }
  }

  // Delete a scenario
  deleteScenario(id: string): void {
    this.scenarios = this.scenarios.filter(s => s.id !== id)
    this.saveToLocalStorage()
  }

  // Get public scenarios
  getPublicScenarios(): Scenario[] {
    return this.scenarios.filter(s => s.isPublic)
  }

  // Generate AI suggestions
  generateAISuggestions(): string[] {
    // Return random suggestions
    const shuffled = [...mockAISuggestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 5)
  }

  // Load from localStorage
  loadFromLocalStorage(): void {
    const saved = localStorage.getItem('mockScenarios')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        this.scenarios = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }))
      } catch (error) {
        console.error('Error loading scenarios from localStorage:', error)
      }
    }
  }

  // Save to localStorage
  private saveToLocalStorage(): void {
    localStorage.setItem('mockScenarios', JSON.stringify(this.scenarios))
  }

  // Initialize service
  constructor() {
    this.loadFromLocalStorage()
  }
}

export const mockDataService = new MockDataService()


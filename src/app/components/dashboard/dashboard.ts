import { Component, signal, computed } from '@angular/core'; 
import { CommonModule } from '@angular/common';

interface JournalEntry {
  date: Date; 
  mood: string;
  emoji: string;
  entry: string;
  sleepHours: number | null; 
}

interface Mood {
  emoji: string;
  label: string;
  level: number;
}


interface WeeklyDataPoint {
  day: string;
  moodLevel: number;
  sleepHours: number; 
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent {
  journalEntry = signal<string>('');
  sleepInput = signal<string>(''); 
  selectedMood = signal<string>('Okay');
  journalHistory = signal<JournalEntry[]>([]); 
  
  private storageKey = 'mindcare-journal-history';

  readonly userMoods: Mood[] = [
    { emoji: '😩', label: 'Awful', level: 20 },
    { emoji: '😔', label: 'Bad', level: 40 },
    { emoji: '😐', label: 'Okay', level: 60 },
    { emoji: '🙂', label: 'Good', level: 80 },
    { emoji: '😄', label: 'Great', level: 100 },
  ];
  
  private readonly moodLevelMap = new Map(this.userMoods.map(m => [m.label, m.level]));
  
  // --- COMPUTED 1: Graph (Mood + Sleep) ---
  weeklyChartData = computed(() => {
    const history = this.journalHistory();
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; 
    const today = new Date();
    
    const dayOfWeek = today.getDay(); 
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyData: WeeklyDataPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const entriesForDay = history.filter(entry => 
        entry.date.getFullYear() === dayDate.getFullYear() &&
        entry.date.getMonth() === dayDate.getMonth() &&
        entry.date.getDate() === dayDate.getDate()
      );

      let averageMoodLevel = 0;
      let averageSleep = 0;

      if (entriesForDay.length > 0) {
       
        const totalMoodLevel = entriesForDay.reduce((sum, entry) => {
          return sum + (this.moodLevelMap.get(entry.mood) || 60); 
        }, 0);
        averageMoodLevel = totalMoodLevel / entriesForDay.length;
        

        const entriesWithSleep = entriesForDay.filter(e => e.sleepHours !== null && e.sleepHours > 0);
        if (entriesWithSleep.length > 0) {
           const totalSleep = entriesWithSleep.reduce((sum, entry) => {
            return sum + entry.sleepHours!;
          }, 0);
          averageSleep = totalSleep / entriesWithSleep.length;
        }
      }

      weeklyData.push({
        day: days[i],
        moodLevel: averageMoodLevel,
        sleepHours: averageSleep 
      });
    }
    
    return weeklyData;
  });

  currentStressLevel = computed(() => {
    const history = this.journalHistory();
    const today = new Date();
    
    const todaysEntries = history.filter(entry => 
      entry.date.getFullYear() === today.getFullYear() &&
      entry.date.getMonth() === today.getMonth() &&
      entry.date.getDate() === today.getDate()
    );

    if (todaysEntries.length === 0) {
      return { label: 'N/A', class: 'value-na', icon: '❓' };
    }

    const totalLevel = todaysEntries.reduce((sum, entry) => {
      return sum + (this.moodLevelMap.get(entry.mood) || 60);
    }, 0);
    const averageLevel = totalLevel / todaysEntries.length;

    if (averageLevel > 80) { // Great (100)
      return { label: 'Excellent', class: 'value-low', icon: '😄' }; // Green color
    } else if (averageLevel > 60) { // Good (80)
      return { label: 'Low', class: 'value-low', icon: '😌' }; // Green color
    } else if (averageLevel > 40) { // Okay (60)
      return { label: 'Medium', class: 'value-medium', icon: '😐' }; // Yellow color
    } else if (averageLevel > 20) { // Bad (40)
      return { label: 'High', class: 'value-high', icon: '😥' }; // Red color
    } else { // Awful (20)
      return { label: 'Very High', class: 'value-high', icon: '😩' }; // Red color
    }
  });

  todaysSleep = computed(() => {
    const history = this.journalHistory();
    const today = new Date();
    
    const latestEntryForToday = history
      .filter(entry => 
        entry.date.getFullYear() === today.getFullYear() &&
        entry.date.getMonth() === today.getMonth() &&
        entry.date.getDate() === today.getDate() &&
        entry.sleepHours !== null
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0]; 

    if (latestEntryForToday && latestEntryForToday.sleepHours) {
      return { hours: latestEntryForToday.sleepHours, unit: 'h' };
    }
    return { hours: 'N/A', unit: '' };
  });

  constructor() {
    this.loadHistoryFromStorage(); 
  }

  private loadHistoryFromStorage() {
    try {
      const savedHistory = localStorage.getItem(this.storageKey);
      if (savedHistory) {
        const history: any[] = JSON.parse(savedHistory);
        const parsedHistory = history.map(entry => ({
          ...entry,
          date: new Date(entry.date),
          sleepHours: entry.sleepHours || null 
        }));
        this.journalHistory.set(parsedHistory);
      }
    } catch (e) {
      console.error("Failed to load journal history:", e);
    }
  }

  private saveHistoryToStorage() {
    try {
      const historyString = JSON.stringify(this.journalHistory());
      localStorage.setItem(this.storageKey, historyString);
    } catch (e) {
      console.error("Failed to save journal history:", e);
    }
  }

  selectMood(moodLabel: string) {
    this.selectedMood.set(moodLabel);
  }

  saveJournalEntry() {
    if (this.journalEntry().trim() === '' && this.sleepInput().trim() === '') return;

    const currentMood = this.userMoods.find(m => m.label === this.selectedMood()) || this.userMoods[2];
    const sleepHours = parseFloat(this.sleepInput()) || null;

    const newEntry: JournalEntry = {
      date: new Date(), 
      mood: this.selectedMood(),
      emoji: currentMood.emoji,
      entry: this.journalEntry(),
      sleepHours: sleepHours 
    };
    
    this.journalHistory.update(history => [newEntry, ...history]);
    this.saveHistoryToStorage();
    
    this.journalEntry.set('');
    this.sleepInput.set('');
  }

  getMoodColor(level: number): string {
    if (level === 0) return 'mood-0'; 
    if (level <= 20) return 'mood-20';
    if (level <= 40) return 'mood-40';
    if (level <= 60) return 'mood-60';
    if (level <= 80) return 'mood-80';
    return 'mood-100';
  }
}
import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Track {
  title: string;
  artist: string;
  url: string;
}

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestions.html',
  styleUrls: ['./suggestions.css']
})
export class SuggestionsComponent implements OnDestroy {
  currentActivity = signal<string | null>(null);
  activityIntervalId = signal<any>(null);

  activityTimer = signal<number>(20 * 60);
  
  meditationState = signal<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  meditationAnimationClass = signal('');
  private meditationCycle: { state: 'Inhale' | 'Hold' | 'Exhale' | 'Pause', duration: number, anim: string }[] = [
    { state: 'Inhale', duration: 4000, anim: 'meditation-inhale' },
    { state: 'Hold', duration: 2000, anim: 'meditation-inhale' },
    { state: 'Exhale', duration: 6000, anim: 'meditation-exhale' },
    { state: 'Pause', duration: 1000, anim: 'meditation-exhale' },
  ];
  private meditationStep = signal(0);
  
  readonly calmPlaylist: Track[] = [
    { 
      title: 'Soft Calm Background Music', 
      artist: 'DELOSound', 
      url: 'https://cdn.pixabay.com/audio/2024/05/23/audio_15a095b600.mp3' 
    },
    { 
      title: 'Piano Background Music Soft', 
      artist: 'HitsLab', 
      url: 'https://cdn.pixabay.com/audio/2024/05/13/audio_104e76d7ae.mp3'
    },
    { 
      title: 'Scary Creepy Horror Music', 
      artist: 'HitsLab', 
      url: 'https://cdn.pixabay.com/audio/2024/04/22/audio_03d9e0004b.mp3'
    },
  ];
  nowPlaying = signal<string | null>(null);

  audioContext = signal<AudioContext | null>(null);
  audioSource = signal<AudioBufferSourceNode | null>(null);
  gainNode = signal<GainNode | null>(null); 
  volume = signal<number>(50); 

  formattedTimer = computed(() => {
    const minutes = Math.floor(this.activityTimer() / 60);
    const seconds = this.activityTimer() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  ngOnDestroy() {
    this.endActivity();
  }

  startActivity(activityName: string) {
    this.endActivity();
    this.currentActivity.set(activityName);

    switch (activityName) {
      case 'Mindful Walk':
        this.activityTimer.set(20 * 60);
        this.activityIntervalId.set(setInterval(() => this.runTimer(), 1000));
        break;
      case 'Guided Meditation':
        this.meditationStep.set(0);
        setTimeout(() => this.runMeditationCycle(), 100);
        break;
      case 'Calm Playlist':
        this.nowPlaying.set(null);
        break;
    }
  }
  
  runTimer() {
    this.activityTimer.update(t => t - 1);
    if (this.activityTimer() <= 0) {
      this.endActivity();
    }
  }

  runMeditationCycle() {
    if (!this.currentActivity()) return;
    
    const currentStep = this.meditationCycle[this.meditationStep()];
    this.meditationState.set(currentStep.state);
    this.meditationAnimationClass.set(currentStep.anim);
    
    this.activityIntervalId.set(setTimeout(() => {
      this.meditationStep.update(s => (s + 1) % this.meditationCycle.length);
      this.runMeditationCycle();
    }, currentStep.duration));
  }

  endActivity() {
    if (this.activityIntervalId()) {
      clearInterval(this.activityIntervalId());
      this.activityIntervalId.set(null);
    }
    this.stopMusic();
    this.currentActivity.set(null);
  }

  togglePlay(trackTitle: string) {
    if (this.nowPlaying() === trackTitle) {
      this.stopMusic();
      this.nowPlaying.set(null);
    } else {
      this.stopMusic(); 
      const track = this.calmPlaylist.find(t => t.title === trackTitle);
      if (track) {
        this.playMusic(track.url); 
        this.nowPlaying.set(trackTitle);
      }
    }
  }

  async playMusic(url: string) {
    if (!this.audioContext()) {
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.audioContext.set(newAudioContext);
    }
    const context = this.audioContext()!;
    
    if (context.state === 'suspended') {
      await context.resume();
    }
    
    
    this.stopMusic();

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true; 
      
      const gain = context.createGain();
      const mappedVolume = this.volume() / 100; 
      gain.gain.setValueAtTime(mappedVolume, context.currentTime);
      
      source.connect(gain);
      gain.connect(context.destination);
      source.start();
      
      this.audioSource.set(source);
      this.gainNode.set(gain);

    } catch (e) {
      console.error("Error playing audio: ", e);
      this.nowPlaying.set(null);
    }
  }

  stopMusic() {
    if (this.audioSource()) {
      this.audioSource()!.stop();
      this.audioSource.set(null);
    }
    if (this.gainNode()) {
      this.gainNode()!.disconnect();
      this.gainNode.set(null);
    }
  }

  changeVolume(event: Event) {
    const newVolume = (event.target as HTMLInputElement).valueAsNumber;
    this.volume.set(newVolume);

    if (this.gainNode()) {
      const mappedVolume = newVolume / 100;
      this.gainNode()!.gain.setValueAtTime(mappedVolume, this.audioContext()!.currentTime);
    }
  }
}
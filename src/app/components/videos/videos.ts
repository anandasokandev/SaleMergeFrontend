import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/users';

interface VideoItem {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  duration: string;
  status: 'completed' | 'processing' | 'failed';
  drive_url?: string;
}

@Component({
  selector: 'app-videos',
  imports: [CommonModule],
  templateUrl: './videos.html',
  styleUrl: './videos.css',
})

export class Videos implements OnInit {
  videos = signal<VideoItem[]>([]);
  loading = signal(false);
  page = signal(1);
  pageSize = signal(9);
  userId = signal<number | null>(null);

  total = computed(() => this.videos().length);

  totalPages = computed(() =>
    this.total() === 0 ? 1 : Math.ceil(this.total() / this.pageSize())
  );

  pagedVideos = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.videos().slice(start, start + this.pageSize());
  });

  constructor(
    private router: Router,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      this.userId.set(Number(storedUserId));
    }
  }

  playingVideo = signal<VideoItem | null>(null);

  get safeVideoUrl(): SafeResourceUrl | null {
    const video = this.playingVideo();
    if (!video?.drive_url) return null;

    // Robustly transform Google Drive View URL to Preview URL
    // Supports:
    // https://drive.google.com/file/d/VIDEO_ID/view?usp=sharing
    // https://drive.google.com/file/d/VIDEO_ID/view
    // https://drive.google.com/open?id=VIDEO_ID (less common for video, but possible)

    let embedUrl = video.drive_url;

    // Pattern to extract file ID: /file/d/([a-zA-Z0-9_-]+)
    const fileIdMatch = embedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      embedUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  closeVideo() {
    this.playingVideo.set(null);
  }

  ngOnInit(): void {
    if (!this.userId()) {
      console.error('User not logged in');
      return;
    }

    this.loadVideos(this.userId()!);
  }

  loadVideos(userId: number) {
    this.loading.set(true);

    this.userService.getGeneratedVideos(userId).subscribe({
      next: (response: any) => {
        const apiVideos = response?.message?.videos ?? [];

        const mappedVideos: VideoItem[] = apiVideos.map((v: any) => {
          let description = '';
          try {
            const parsed = JSON.parse(v.input_text);
            description = parsed.name;
          } catch {
            description = 'Generated video';
          }


          return {
            id: v.id,
            title: 'Generated Video',
            description,
            thumbnailUrl: 'thumbnail.png',
            createdAt: v.created_at,
            duration: '—',
            status: this.mapStatus(v.status),
            // Check possible property names for the Drive URL
            drive_url: v.drive_link
          };
        });

        this.videos.set(mappedVideos);
        this.page.set(1);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching videos:', error);
        this.videos.set([]);
        this.loading.set(false);
      },
    });
  }

  mapStatus(status: string): VideoItem['status'] {
    if (!status) return 'processing';
    const s = status.toUpperCase();
    switch (s) {
      case 'DONE':
      case 'COMPLETED':
        return 'completed';
      case 'PROCESSING':
      case 'PENDING':
        return 'processing';
      case 'FAILED':
      case 'ERROR':
        return 'failed';
      default:
        return 'processing';
    }
  }

  onCreateNew() {
    this.router.navigate(['/dashboard']);
  }

  openVideo(video: VideoItem) {
    if (video.status !== 'completed') return;

    if (video.drive_url) {
      this.playingVideo.set(video);
    } else {
      alert('Video URL not found. The video might still be processing or the link is missing.');
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) this.page.update(p => p + 1);
  }

  prevPage() {
    if (this.page() > 1) this.page.update(p => p - 1);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.page.set(page);
    }
  }

  statusClasses(status: VideoItem['status']) {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'processing':
        return 'bg-amber-100 text-amber-700';
      case 'failed':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}

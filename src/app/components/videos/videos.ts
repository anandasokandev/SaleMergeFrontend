import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface VideoItem {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  duration: string;
  status: 'completed' | 'processing' | 'failed';
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

  total = computed(() => this.videos().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  pagedVideos = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.videos().slice(start, start + this.pageSize());
  });

  constructor(private router: Router) {}

  ngOnInit(): void {
    // TODO: Replace with API call
    this.loading.set(true);
    setTimeout(() => {
      this.videos.set([
        {
          id: 1,
          title: 'Car Insurance Explainer',
          description: 'Personalized video for John Doe about car insurance renewal.',
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Video+1',
          createdAt: '2025-12-10T10:30:00.000Z',
          duration: '01:23',
          status: 'completed',
        },
        {
          id: 2,
          title: 'Health Plan Overview',
          description: 'Video explaining health insurance benefits for corporate clients.',
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Video+2',
          createdAt: '2025-12-09T14:15:00.000Z',
          duration: '02:05',
          status: 'processing',
        },
        {
          id: 3,
          title: 'Loan Protection Pitch',
          description: 'Short pitch video for loan protection add-on.',
          thumbnailUrl: 'https://via.placeholder.com/400x225?text=Video+3',
          createdAt: '2025-12-08T09:00:00.000Z',
          duration: '00:58',
          status: 'failed',
        },
      ]);
      this.loading.set(false);
    }, 300);
  }

  onCreateNew() {
    this.router.navigate(['/dashboard']);
  }

  openVideo(video: VideoItem) {
    this.router.navigate(['/videos', video.id]);
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

  nextPage() {
    if (this.page() < this.totalPages()) this.page.update(p => p + 1);
  }

  prevPage() {
    if (this.page() > 1) this.page.update(p => p - 1);
  }

  setPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) this.page.set(page);
  }
}
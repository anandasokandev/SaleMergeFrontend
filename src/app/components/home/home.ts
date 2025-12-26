import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';


interface Video {
  id: number;
  name: string;
  description?: string;
  duration: string;
}


@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})

export class Home implements OnInit {
  quoteForm!: FormGroup;
  isProcessing = false;
  taxRate = 18; // 18% GST

  // Common video (always selected)
  commonVideo: Video = {
    id: 0,
    name: 'Introduction & Brand Overview',
    description: 'Professional company introduction and brand showcase video',
    duration: '2:30',
  };

  // Additional videos (optional selection)
  additionalVideos: Video[] = [
    { id: 1, name: 'Product Demo Video', duration: '3:00'},
    { id: 2, name: 'Customer Testimonials', duration: '2:00'},
    { id: 3, name: 'Behind the Scenes', duration: '1:30'},
    { id: 4, name: 'Social Media Promo', duration: '0:45'},
    { id: 5, name: 'Explainer Animation', duration: '2:15'},
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.quoteForm = this.fb.group({
      clientName: ['', Validators.required],
      selectedVideos: this.fb.array(
        this.additionalVideos.map(() => this.fb.control(false))
      ),
      discount: [0, [Validators.min(0), Validators.max(100)]],
      notes: ['']
    });
  }

  getSelectedVideosArray(): FormArray {
    return this.quoteForm.get('selectedVideos') as FormArray;
  }

  getSelectedAdditionalVideos(): Video[] {
    return this.additionalVideos.filter((video, index) => {
      return this.getSelectedVideosArray().at(index).value === true;
    });
  }

  generateQuote() {
    if (this.quoteForm.invalid) {
      return;
    }

    this.isProcessing = true;

    const quoteData = {
      clientName: this.quoteForm.get('clientName')?.value,
      commonVideo: this.commonVideo,
      additionalVideos: this.getSelectedAdditionalVideos(),
      notes: this.quoteForm.get('notes')?.value
    };

    console.log('Quote Data:', quoteData);

    // TODO: Call API to generate and download video
    setTimeout(() => {
      this.isProcessing = false;
      alert('Video generation started! You will receive a download link shortly.');
    }, 2000);
  }

  saveQuote() {
    if (this.quoteForm.invalid) {
      return;
    }

    const quoteData = {
      clientName: this.quoteForm.get('clientName')?.value,
      commonVideo: this.commonVideo,
      additionalVideos: this.getSelectedAdditionalVideos(),
      notes: this.quoteForm.get('notes')?.value
    };

    console.log('Saving Quote:', quoteData);

    // TODO: Call API to save quote
    alert('Quote saved successfully!');
  }
}
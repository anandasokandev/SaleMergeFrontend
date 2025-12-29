import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VideoGenerationService } from '../../services/video-generation';
import { finalize } from 'rxjs/operators';
import { ToastService } from '../../services/toast';


interface Video {
  id: number;
  name: string;
  description?: string;
  duration: string;
  price: number | null;
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
  taxRate = 0; // 0% GST

  // Common video (always selected)
  commonVideo: Video = {
    id: 0,
    name: 'Introduction & Brand Overview',
    description: 'Professional company introduction and brand showcase video',
    duration: '2:30',
    price: 5000
  };

  // Additional videos (optional selection)
  additionalVideos: Video[] = [
    { id: 1, name: 'Gullak', duration: '3:00', price: null },
    { id: 2, name: 'Saradhi', duration: '2:00', price: null },
    { id: 3, name: 'Ananth', duration: '1:30', price: null },
    { id: 4, name: 'Any Room', duration: '0:45', price: null },
    { id: 5, name: 'Restoration', duration: '2:15', price: null },
    { id: 6, name: 'Coverage for Non-Medical', duration: '2:00', price: null },
    { id: 7, name: 'Health Checkup', duration: '3:30', price: null },
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private videoGenerationService: VideoGenerationService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  planOptions = ['Silver Plan', 'Gold Plan', 'Platinum Plan', 'Family Floater', 'Senior Citizen'];
  coverTypeOptions = ['Individual', 'Floater', 'Group'];

  initForm() {
    this.quoteForm = this.fb.group({
      clientName: ['', Validators.required],
      planName: ['', Validators.required],
      sumInsured: [null, [Validators.required, Validators.min(0)]],
      coverType: ['', Validators.required],
      addons: this.fb.array([]),
      baseVideoPrice: [5000, [Validators.required, Validators.min(0)]],
      videoSelections: this.fb.array(
        this.additionalVideos.map(video => this.fb.group({
          isSelected: [false],
          price: [video.price, [Validators.required, Validators.min(0)]]
        }))
      ),
      notes: ['']
    });

    // Handle video selection enablement
    const videoSelections = this.quoteForm.get('videoSelections') as FormArray;
    videoSelections.controls.forEach(control => {
      const isSelected = control.get('isSelected');
      const price = control.get('price');

      // Initial state
      if (!isSelected?.value) {
        price?.disable();
      }

      // Listen for changes
      isSelected?.valueChanges.subscribe(selected => {
        if (selected) {
          price?.enable();
        } else {
          price?.disable();
          price?.setValue(null);
        }
      });
    });

  }

  get addons() {
    return this.quoteForm.get('addons') as FormArray;
  }

  addAddon() {
    const addonGroup = this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]]
    });
    this.addons.push(addonGroup);
  }

  removeAddon(index: number) {
    this.addons.removeAt(index);
  }

  getVideoSelectionsArray(): FormArray {
    return this.quoteForm.get('videoSelections') as FormArray;
  }

  getSelectedAdditionalVideos(): Video[] {
    const selections = this.getVideoSelectionsArray();
    return this.additionalVideos
      .map((video, index) => {
        const control = selections.at(index);
        if (control.get('isSelected')?.value) {
          return { ...video, price: control.get('price')?.value };
        }
        return null;
      })
      .filter((v): v is Video => v !== null);
  }

  generateQuote() {
    if (this.quoteForm.invalid) {
      return;
    }

    this.isProcessing = true;
    const formValue = this.quoteForm.value;
    const selectedVideos = this.getSelectedAdditionalVideos();

    // 1. Prepare Video IDs (Selected Additionals only)
    // Note: Base Video (ID 0) is implicit/always required, so we don't pass it.
    const videoIds = [...selectedVideos.map(v => v.id)];

    // 2. Prepare Add-ons List
    // Combine Manual Policy Add-ons AND Selected Video Segments
    const formattedAddons = [
      // Manual Add-ons
      ...formValue.addons.map((addon: any) => ({
        name: addon.name,
        price: this.formatCurrency(addon.price)
      })),
      // Video Segments as Add-ons
      ...selectedVideos.map(video => ({
        name: video.name,
        price: this.formatCurrency(video.price || 0)
      }))
    ];

    const payload = {
      name: formValue.clientName,
      videos: videoIds,
      quote_details: {
        plan_name: formValue.planName,
        sum_insured: this.formatCurrency(formValue.sumInsured),
        cover_type: formValue.coverType,
        addons: formattedAddons,
        total_premium: this.formatCurrency(this.getTotalAmount())
      }
    };

    console.log('Generated Quote Payload:', JSON.stringify(payload, null, 2));

    this.isProcessing = true;
    this.videoGenerationService.generateVideo(payload)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: (response: any) => {
          // Check for success string or status in message
          // API returns: { success: "...", message: { status: "PENDING", ... }, data: ... }
          const isSuccess = response.success || (response.message && response.message.status === 'PENDING');

          if (isSuccess) {
            this.toastService.success('Quote generation is successfully submitted', 'Success');
            this.quoteForm.reset();
            // Optional: Redirect or show download link if provided in response
            if (response.data && response.data.downloadUrl) {
              window.open(response.data.downloadUrl, '_blank');
            }
          } else {
            this.toastService.error('Failed to generate video: ' + (typeof response.message === 'string' ? response.message : JSON.stringify(response.message)));
          }
        },
        error: (error) => {
          console.error('Error generating video:', error);
          this.toastService.error('An error occurred while generating the video. Please try again.', 'Error');
        }
      });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  getSubtotal(): number {
    const commonPrice = this.quoteForm.get('baseVideoPrice')?.value || 0;
    const additionalPrice = this.getSelectedAdditionalVideos().reduce((sum, video) => sum + (video.price || 0), 0);
    const addonsPrice = this.addons.controls.reduce((sum, control) => sum + (control.get('price')?.value || 0), 0);
    return commonPrice + additionalPrice + addonsPrice;
  }

  getDiscountAmount(): number {
    return 0; // Discount removed
  }

  getTaxAmount(): number {
    const subtotal = this.getSubtotal();
    return (subtotal * this.taxRate) / 100;
  }

  getTotalAmount(): number {
    const subtotal = this.getSubtotal();
    const tax = this.getTaxAmount();
    return subtotal + tax;
  }
}
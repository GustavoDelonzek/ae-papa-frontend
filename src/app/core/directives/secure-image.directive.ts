import { Directive, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'img[secureImage]',
  standalone: true
})
export class SecureImageDirective implements OnChanges, OnDestroy {
  @Input() secureImage: string | null | undefined = null;
  @Input() fallbackImage: string = ''; // Can be an empty string if we don't need a fallback

  private objectUrl: string | null = null;
  private sub: Subscription | null = null;

  constructor(private el: ElementRef<HTMLImageElement>, private http: HttpClient, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['secureImage']) {
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    this.cleanUp();
  }

  private cleanUp(): void {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private loadImage(): void {
    this.cleanUp();
    
    // Add loading shimmer class and a transparent placeholder
    this.renderer.addClass(this.el.nativeElement, 'secure-image-loading');
    this.el.nativeElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    if (!this.secureImage) {
      this.renderer.removeClass(this.el.nativeElement, 'secure-image-loading');
      if (this.fallbackImage) {
        this.el.nativeElement.src = this.fallbackImage;
      }
      return;
    }

    this.sub = this.http.get(this.secureImage, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.el.nativeElement.src = this.objectUrl;
        this.renderer.removeClass(this.el.nativeElement, 'secure-image-loading');
      },
      error: (err: any) => {
        console.error('Error loading secure image:', err);
        this.renderer.removeClass(this.el.nativeElement, 'secure-image-loading');
        if (this.fallbackImage) {
          this.el.nativeElement.src = this.fallbackImage;
        }
      }
    });
  }
}

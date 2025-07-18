import { Directive, ElementRef, OnInit, OnDestroy, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  @Input() animationThreshold: number = 0.4;
  @Input() animationOnetime: boolean = true;

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private setupIntersectionObserver(): void {
    if (!this.isIntersectionObserverSupported()) {
      this.applyAnimationFallback();
      return;
    }

    const options = this.getObserverOptions();
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);
    this.observer.observe(this.el.nativeElement);
  }

  private isIntersectionObserverSupported(): boolean {
    return typeof IntersectionObserver !== 'undefined';
  }

  private applyAnimationFallback(): void {
    this.renderer.addClass(this.el.nativeElement, 'animate');
    console.warn('IntersectionObserver nicht unterstützt. Animation wird sofort abgespielt für:', this.el.nativeElement);
  }

  private getObserverOptions(): IntersectionObserverInit {
    return {
      root: null,
      rootMargin: '0px',
      threshold: this.animationThreshold
    };
  }

  private handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver): void {
    entries.forEach(entry => this.processEntry(entry, observer));
  }

  private processEntry(entry: IntersectionObserverEntry, observer: IntersectionObserver): void {
    if (entry.isIntersecting) {
      this.renderer.addClass(this.el.nativeElement, 'animate');
      if (this.animationOnetime) {
        observer.unobserve(entry.target);
      }
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
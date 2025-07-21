import { Directive, ElementRef, OnInit, OnDestroy, Input, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  @Input() animationThreshold: number = 0.3;
  @Input() animationOnetime: boolean = true;

  private observer!: IntersectionObserver;
  private readonly SESSION_KEY_PREFIX = 'animated_';
  private isBrowser: boolean;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const hasAnimatedKey = `${this.SESSION_KEY_PREFIX}${this.el.nativeElement.id || this.el.nativeElement.tagName}`;
    if (sessionStorage.getItem(hasAnimatedKey) === 'true' || !this.isIntersectionObserverSupported()) {
      this.renderer.addClass(this.el.nativeElement, 'animate');
      if (!this.isIntersectionObserverSupported()) {
        console.warn('IntersectionObserver nicht unterstützt. Animation wird sofort abgespielt für:', this.el.nativeElement);
      }
      return;
    }
    this.setupIntersectionObserver(hasAnimatedKey);
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private setupIntersectionObserver(sessionKey: string): void {
    const options = this.getObserverOptions();
    this.observer = new IntersectionObserver(
      (entries, observer) => this.handleIntersection(entries, observer, sessionKey),
      options
    );
    this.observer.observe(this.el.nativeElement);
  }

  private isIntersectionObserverSupported(): boolean {
    return typeof IntersectionObserver !== 'undefined';
  }

  private getObserverOptions(): IntersectionObserverInit {
    return {
      root: null,
      rootMargin: '0px',
      threshold: this.animationThreshold
    };
  }

  private handleIntersection(entries: IntersectionObserverEntry[], observer: IntersectionObserver, sessionKey: string): void {
    entries.forEach(entry => this.processEntry(entry, observer, sessionKey));
  }

  private processEntry(entry: IntersectionObserverEntry, observer: IntersectionObserver, sessionKey: string): void {
    if (entry.isIntersecting) {
      this.renderer.addClass(this.el.nativeElement, 'animate');
      sessionStorage.setItem(sessionKey, 'true');
      observer.unobserve(entry.target);
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
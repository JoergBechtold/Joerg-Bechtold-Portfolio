import { Directive, ElementRef, OnInit, OnDestroy, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appAnimateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit, OnDestroy {
  // @Input, um den Schwellenwert (threshold) für den Observer anzupassen
  // Standardwert ist jetzt 0.5, kann aber immer noch überschrieben werden
  @Input() animationThreshold: number = 0.5; // Hier wird der globale Standardwert festgelegt

  // @Input, um die Animation als "onetime" zu markieren (spielt nur einmal ab)
  @Input() animationOnetime: boolean = true;

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.renderer.addClass(this.el.nativeElement, 'animate');
      console.warn('IntersectionObserver not supported. Animation will play immediately for:', this.el.nativeElement);
      return;
    }

    const options = {
      root: null, // Der Viewport als Root
      rootMargin: '0px',
      threshold: this.animationThreshold // Dieser Wert kommt jetzt vom @Input der Direktive
    };

    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(this.el.nativeElement, 'animate');

          if (this.animationOnetime) {
            observer.unobserve(entry.target);
          }
        }
      });
    }, options);

    this.observer.observe(this.el.nativeElement);
  }
}
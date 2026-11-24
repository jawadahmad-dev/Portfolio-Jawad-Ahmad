import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>);
  readonly delay = input(0);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      this.element.nativeElement.classList.add('reveal-visible');
      return;
    }

    const node = this.element.nativeElement;
    node.style.setProperty('--reveal-delay', `${this.delay()}ms`);
    node.classList.add('reveal-ready');

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          node.classList.add('reveal-visible');
          this.observer?.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

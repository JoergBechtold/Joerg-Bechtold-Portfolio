import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BaseTranslatableComponent } from '../../shared/base/base.component'; // Passe den Pfad bei Bedarf an

@Component({
    selector: 'app-about-me',
    standalone: true,
    imports: [TranslateModule, CommonModule],
    templateUrl: './about-me.component.html',
    styleUrl: './about-me.component.scss'
})
export class AboutMeComponent extends BaseTranslatableComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('contentLeftElement') contentLeftElement!: ElementRef;
    @ViewChild('contentRightElement') contentRightElement!: ElementRef;
    @ViewChild('sectionElement') sectionElement!: ElementRef;

    animateLeft: boolean = false;
    animateRight: boolean = false;

    private observer!: IntersectionObserver;

    constructor(protected override translate: TranslateService) {
        super(translate);
    }


    override ngOnInit(): void {
        super.ngOnInit();

    }


    ngAfterViewInit(): void {
        this.setupIntersectionObserver();
    }


    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    private setupIntersectionObserver(): void {

        if (typeof IntersectionObserver === 'undefined') {
            this.animateLeft = true;
            this.animateRight = true;
            console.warn('IntersectionObserver not supported. Animation will play immediately.');
            return;
        }

        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3
        };

        this.observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateLeft = true;
                    this.animateRight = true;
                    observer.unobserve(entry.target);
                }

                // else {
                //     this.animateLeft = false;
                //     this.animateRight = false;
                // }
            });
        }, options);

        if (this.sectionElement) {
            this.observer.observe(this.sectionElement.nativeElement);
        } else {
            console.error('Section element not found for Intersection Observer.');
        }
    }
}
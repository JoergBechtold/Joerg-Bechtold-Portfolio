import { Component } from '@angular/core';
import { AboutMeComponent } from '../components-sections/about-me/about-me.component';
import { MySkillsComponent } from '../components-sections/my-skills/my-skills.component';
import { PortfolioComponent } from '../components-sections/portfolio/portfolio.component';
import { AtfComponent } from "../atf/atf.component";
import { TranslateModule } from '@ngx-translate/core';


@Component({
    selector: 'app-main-content',
    imports: [AboutMeComponent, MySkillsComponent, PortfolioComponent, AtfComponent, TranslateModule],
    templateUrl: './main-content.component.html',
    styleUrl: './main-content.component.scss'
})
export class MainContentComponent {

}

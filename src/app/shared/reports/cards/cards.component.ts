import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SummaryCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
  
})
export class CardsComponent {
  @Input() cards: SummaryCard[] = [];
}

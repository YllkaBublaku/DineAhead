import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cities',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './cities.html',
  styleUrl: './cities.css'
})
export class Cities {

  countries = [
    {
      name: 'France',
      flag: '🇫🇷',
      color: 'from-blue-500 to-red-500',
      popularCities: [
        { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Lyon', image: 'https://images.unsplash.com/photo-1560264419-5a5f2e9a3c1c?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Marseille', image: 'https://images.unsplash.com/photo-1558452070-b6a48a3d9c21?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Nice', image: 'https://images.unsplash.com/photo-1491166617655-0723a1d5e3a5?auto=format&fit=crop&w=400&h=300&q=80' }
      ],
      allCities: ['Bordeaux', 'Toulouse', 'Montpellier', 'Strasbourg', 'Nantes', 'Lille', 'Rennes', 'Aix-en-Provence']
    },
    {
      name: 'Belgium',
      flag: '🇧🇪',
      color: 'from-yellow-400 to-red-500',
      popularCities: [
        { name: 'Brussels', image: 'https://images.unsplash.com/photo-1565619620042-1a678a31a2a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Antwerp', image: 'https://images.unsplash.com/photo-1562175450-1c7e4b0d5b2a?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Bruges', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Ghent', image: 'https://images.unsplash.com/photo-1513077202513-c2c9f4a5e1c8?auto=format&fit=crop&w=400&h=300&q=80' }
      ],
      allCities: ['Namur', 'Mons', 'Liège', 'Waterloo', 'Wavre', 'Charleroi', 'Nivelles', 'Tournai']
    },
    {
      name: 'Italy',
      flag: '🇮🇹',
      color: 'from-green-500 to-red-500',
      popularCities: [
        { name: 'Rome', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Milan', image: 'https://images.unsplash.com/photo-1513581166391-887a96ddeafd?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Florence', image: 'https://images.unsplash.com/photo-1543429258-2b6d5c3b2a4e?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Venice', image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=400&h=300&q=80' }
      ],
      allCities: ['Turin', 'Naples', 'Bologna', 'Genoa', 'Verona', 'Bari']
    },
    {
      name: 'Spain',
      flag: '🇪🇸',
      color: 'from-red-500 to-yellow-400',
      popularCities: [
        { name: 'Madrid', image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Seville', image: 'https://images.unsplash.com/photo-1559570278-eb8d71d06403?auto=format&fit=crop&w=400&h=300&q=80' },
        { name: 'Valencia', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=400&h=300&q=80' }
      ],
      allCities: ['Bilbao', 'Granada', 'Malaga', 'Zaragoza']
    }
  ];
}

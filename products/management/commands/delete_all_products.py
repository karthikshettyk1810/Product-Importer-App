from django.core.management.base import BaseCommand
from products.models import Product


class Command(BaseCommand):
    help = 'Delete all products from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without confirmation',
        )

    def handle(self, *args, **options):
        count = Product.objects.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No products to delete.'))
            return
        
        if not options['force']:
            confirm = input(f'Are you sure you want to delete {count:,} products? (yes/no): ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Deletion cancelled.'))
                return
        
        self.stdout.write(f'Deleting {count:,} products...')
        
        # Delete in batches to avoid memory issues
        batch_size = 10000
        deleted_total = 0
        
        while True:
            ids = list(Product.objects.values_list('id', flat=True)[:batch_size])
            if not ids:
                break
            
            deleted_count = Product.objects.filter(id__in=ids).delete()[0]
            deleted_total += deleted_count
            self.stdout.write(f'Deleted {deleted_total:,} products...')
        
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully deleted {deleted_total:,} products!'))

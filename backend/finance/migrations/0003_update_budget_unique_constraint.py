# Generated migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0002_add_category_to_budget_and_remove_user_names'),
    ]

    operations = [
        # Step 1: Delete any budgets with null category (invalid data)
        migrations.RunSQL(
            sql="DELETE FROM finance_budget WHERE category_id IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
        
        # Step 2: Remove old unique constraint
        migrations.AlterUniqueTogether(
            name='budget',
            unique_together=set(),
        ),
        
        # Step 3: Make category required (non-nullable)
        migrations.AlterField(
            model_name='budget',
            name='category',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='budget_entries',
                to='finance.category',
                null=False
            ),
        ),
        
        # Step 4: Add new unique constraint (user, category, year, month)
        migrations.AlterUniqueTogether(
            name='budget',
            unique_together={('user', 'category', 'year', 'month')},
        ),
    ]


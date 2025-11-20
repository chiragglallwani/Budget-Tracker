# Generated migration

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='budget',
            name='category',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='budget_entries',
                to='finance.category',
            ),
        ),
        
        migrations.RunSQL(
            sql=[
                """
                CREATE OR REPLACE FUNCTION check_budget_category_is_expense()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NEW.category_id IS NOT NULL THEN
                        IF EXISTS (
                            SELECT 1 FROM finance_category 
                            WHERE id = NEW.category_id 
                            AND is_income = TRUE
                        ) THEN
                            RAISE EXCEPTION 'Budget can only be associated with expense categories (is_income=false).';
                        END IF;
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
                """,
                """
                CREATE TRIGGER budget_category_expense_check
                BEFORE INSERT OR UPDATE ON finance_budget
                FOR EACH ROW
                EXECUTE FUNCTION check_budget_category_is_expense();
                """
            ],
            reverse_sql=[
                "DROP TRIGGER IF EXISTS budget_category_expense_check ON finance_budget;",
                "DROP FUNCTION IF EXISTS check_budget_category_is_expense();"
            ],
        ),
        
        migrations.RemoveField(
            model_name='user',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='user',
            name='last_name',
        ),
    ]


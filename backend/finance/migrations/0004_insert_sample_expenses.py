# Generated migration

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0003_update_budget_unique_constraint'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            INSERT INTO finance_expense (amount, date, note, category_id, user_id, created_at)
            VALUES
            -- Fixed categories: One per month (35 records)
            -- Electricity Bills (category_id: 7) - 7 records
            (3500.00, '2025-05-05', 'Electricity bill for May', 7, 10, NOW()),
            (3800.00, '2025-06-05', 'Electricity bill for June', 7, 10, NOW()),
            (4200.00, '2025-07-05', 'Electricity bill for July', 7, 10, NOW()),
            (4000.00, '2025-08-05', 'Electricity bill for August', 7, 10, NOW()),
            (3600.00, '2025-09-05', 'Electricity bill for September', 7, 10, NOW()),
            (3400.00, '2025-10-05', 'Electricity bill for October', 7, 10, NOW()),
            (3700.00, '2025-11-05', 'Electricity bill for November', 7, 10, NOW()),
            
            -- Water Bills (category_id: 8) - 7 records
            (1200.00, '2025-05-10', 'Water bill for May', 8, 10, NOW()),
            (1300.00, '2025-06-10', 'Water bill for June', 8, 10, NOW()),
            (1250.00, '2025-07-10', 'Water bill for July', 8, 10, NOW()),
            (1400.00, '2025-08-10', 'Water bill for August', 8, 10, NOW()),
            (1150.00, '2025-09-10', 'Water bill for September', 8, 10, NOW()),
            (1100.00, '2025-10-10', 'Water bill for October', 8, 10, NOW()),
            (1350.00, '2025-11-10', 'Water bill for November', 8, 10, NOW()),
            
            -- Internet Bills (category_id: 9) - 7 records
            (2500.00, '2025-05-15', 'Internet bill for May', 9, 10, NOW()),
            (2500.00, '2025-06-15', 'Internet bill for June', 9, 10, NOW()),
            (2500.00, '2025-07-15', 'Internet bill for July', 9, 10, NOW()),
            (2500.00, '2025-08-15', 'Internet bill for August', 9, 10, NOW()),
            (2500.00, '2025-09-15', 'Internet bill for September', 9, 10, NOW()),
            (2500.00, '2025-10-15', 'Internet bill for October', 9, 10, NOW()),
            (2500.00, '2025-11-15', 'Internet bill for November', 9, 10, NOW()),
            
            -- Maintenance (category_id: 13) - 7 records
            (5000.00, '2025-05-20', 'Monthly maintenance for May', 13, 10, NOW()),
            (5000.00, '2025-06-20', 'Monthly maintenance for June', 13, 10, NOW()),
            (5500.00, '2025-07-20', 'Monthly maintenance for July', 13, 10, NOW()),
            (5000.00, '2025-08-20', 'Monthly maintenance for August', 13, 10, NOW()),
            (5000.00, '2025-09-20', 'Monthly maintenance for September', 13, 10, NOW()),
            (5000.00, '2025-10-20', 'Monthly maintenance for October', 13, 10, NOW()),
            (5000.00, '2025-11-20', 'Monthly maintenance for November', 13, 10, NOW()),
            
            -- Subscriptions (category_id: 15) - 7 records
            (999.00, '2025-05-25', 'Monthly subscriptions for May', 15, 10, NOW()),
            (999.00, '2025-06-25', 'Monthly subscriptions for June', 15, 10, NOW()),
            (999.00, '2025-07-25', 'Monthly subscriptions for July', 15, 10, NOW()),
            (999.00, '2025-08-25', 'Monthly subscriptions for August', 15, 10, NOW()),
            (999.00, '2025-09-25', 'Monthly subscriptions for September', 15, 10, NOW()),
            (999.00, '2025-10-25', 'Monthly subscriptions for October', 15, 10, NOW()),
            (999.00, '2025-11-25', 'Monthly subscriptions for November', 15, 10, NOW()),
            
            -- Variable categories: Multiple per month (35 records)
            -- Groceries (category_id: 2) - 7 records
            (2500.00, '2025-05-02', 'Weekly grocery shopping', 2, 10, NOW()),
            (1800.50, '2025-05-16', 'Monthly grocery run', 2, 10, NOW()),
            (2200.00, '2025-06-05', 'Weekly grocery shopping', 2, 10, NOW()),
            (1900.00, '2025-07-10', 'Grocery shopping', 2, 10, NOW()),
            (2100.00, '2025-08-08', 'Weekly grocery shopping', 2, 10, NOW()),
            (2400.00, '2025-09-12', 'Monthly grocery run', 2, 10, NOW()),
            (2300.00, '2025-11-18', 'Weekly grocery shopping', 2, 10, NOW()),
            
            -- Petrol Bills (category_id: 10) - 7 records
            (2000.00, '2025-05-07', 'Petrol fill up', 10, 10, NOW()),
            (1800.00, '2025-06-14', 'Petrol fill up', 10, 10, NOW()),
            (2200.00, '2025-07-22', 'Petrol fill up', 10, 10, NOW()),
            (1900.00, '2025-08-11', 'Petrol fill up', 10, 10, NOW()),
            (2100.00, '2025-09-19', 'Petrol fill up', 10, 10, NOW()),
            (2000.00, '2025-10-06', 'Petrol fill up', 10, 10, NOW()),
            (1950.00, '2025-11-14', 'Petrol fill up', 10, 10, NOW()),
            
            -- Phone EMI (category_id: 11) - 7 records
            (3500.00, '2025-05-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-06-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-07-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-08-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-09-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-10-01', 'Phone EMI payment', 11, 10, NOW()),
            (3500.00, '2025-11-01', 'Phone EMI payment', 11, 10, NOW()),
            
            -- Credit Card Bills (category_id: 12) - 7 records
            (15000.00, '2025-05-12', 'Credit card bill payment', 12, 10, NOW()),
            (12000.00, '2025-06-12', 'Credit card bill payment', 12, 10, NOW()),
            (18000.00, '2025-07-12', 'Credit card bill payment', 12, 10, NOW()),
            (14000.00, '2025-08-12', 'Credit card bill payment', 12, 10, NOW()),
            (16000.00, '2025-09-12', 'Credit card bill payment', 12, 10, NOW()),
            (13000.00, '2025-10-12', 'Credit card bill payment', 12, 10, NOW()),
            (17000.00, '2025-11-12', 'Credit card bill payment', 12, 10, NOW()),
            
            -- Fast Foods (category_id: 14) - 7 records
            (450.00, '2025-05-03', 'Fast food lunch', 14, 10, NOW()),
            (600.00, '2025-05-18', 'Fast food dinner', 14, 10, NOW()),
            (550.00, '2025-06-08', 'Fast food lunch', 14, 10, NOW()),
            (500.00, '2025-07-15', 'Fast food snack', 14, 10, NOW()),
            (650.00, '2025-08-09', 'Fast food dinner', 14, 10, NOW()),
            (480.00, '2025-09-22', 'Fast food lunch', 14, 10, NOW()),
            (520.00, '2025-11-07', 'Fast food dinner', 14, 10, NOW());
            """,
            reverse_sql="""
            DELETE FROM finance_expense 
            WHERE user_id = 10 
            AND category_id IN (2, 7, 8, 9, 10, 11, 12, 13, 14, 15);
            """
        ),
    ]


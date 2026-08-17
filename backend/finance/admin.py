from django.contrib import admin

from .models import Approval, Donation, Expense, Invoice, PaymentOrder

admin.site.register(Donation)
admin.site.register(Expense)
admin.site.register(Invoice)
admin.site.register(Approval)
admin.site.register(PaymentOrder)

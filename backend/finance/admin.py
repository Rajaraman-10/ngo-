from django.contrib import admin

from .models import Approval, Donation, Expense, Invoice, PaymentOrder


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ["transaction_id", "amount", "project", "status", "is_test", "date"]
    list_filter = ["status", "is_test", "source"]


admin.site.register(Expense)
admin.site.register(Invoice)
admin.site.register(Approval)
admin.site.register(PaymentOrder)

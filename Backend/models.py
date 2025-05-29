from tortoise import fields
from tortoise.models import Model

class Admin(Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=50,required=True,unique=True,index=True)
    password = fields.CharField(max_length=100,required=True)
    
class Employee(Model):
    id = fields.IntField(pk=True)
    empid = fields.CharField(max_length=50,unique=True)
    name = fields.CharField(max_length=50)
    email = fields.CharField(max_length=100,unique=True)
    logs: fields.ReverseRelation["TimeLog"]

class TimeLog(Model):
    id = fields.IntField(pk=True)
    employee = fields.ForeignKeyField("models.Employee", related_name="logs")
    timestamp = fields.DatetimeField(auto_now_add=True)
    action = fields.CharField(max_length=10, choices=["IN", "OUT"]) 

class Environment(Model):
    id = fields.IntField(pk=True)
    key = fields.CharField(max_length=50, unique=True)
    value = fields.CharField(max_length=100)
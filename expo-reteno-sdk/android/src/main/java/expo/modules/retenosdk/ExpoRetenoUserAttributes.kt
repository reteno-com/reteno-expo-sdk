
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class RetenoUserAttributesField : Record {
    @Field val key: String = ""
    @Field val value: String = ""
}

class RetenoUserAttributesAddress : Record {
    @Field val region: String? = null
    @Field val town: String? = null
    @Field val address: String? = null
    @Field val postcode: String? = null
}

class RetenoUserAttributes : Record {
    @Field val phone: String? = null
    @Field val email: String? = null
    @Field val firstName: String? = null
    @Field val lastName: String? = null
    @Field val languageCode: String? = null
    @Field val timeZone: String? = null
    @Field val address: RetenoUserAttributesAddress? = null
    @Field val fields: List<RetenoUserAttributesField>? = null
}

class RetenoUserAttributesPayload : Record {
    @Field val externalUserId: String = ""
    @Field val userAttributes: RetenoUserAttributes? = null
    @Field val subscriptionKeys: List<String>? = null
    @Field val groupNamesInclude: List<String>? = null
    @Field val groupNamesExclude: List<String>? = null
}

class RetenoAnonymousUserAttributes: Record {
     @Field val firstName: String = ""
     @Field val lastName: String = ""
     @Field val timeZone: String = ""
     @Field val fields: List<RetenoUserAttributesField>? = null
     @Field val languageCode: String? = null
     @Field val address: RetenoUserAttributesAddress? = null
}

class RetenoMultiAccountUserAttributesPayload : Record {
    @Field val externalUserId: String = ""
    @Field val userAttributes: RetenoUserAttributes? = null
    @Field val subscriptionKeys: List<String>? = null
    @Field val groupNamesInclude: List<String>? = null
    @Field val groupNamesExclude: List<String>? = null
    @Field val accountSuffix: String = ""
}

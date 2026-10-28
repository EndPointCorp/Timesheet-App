# Decides who may send which changes to PUT /users/:id.
#
# Users::UpdateUser applies a free-form list of changes one key at a time and
# cannot undo them, so this runs before it: a refused request applies nothing.
#
# An admin may make any change. A chart editor may add and remove the
# project_manage right, which is what the Managers tab of the work chart editor
# sends. Everyone else may change nothing. Anything this does not recognise is
# refused, so a new kind of change added to the update stays admin-only until it
# is allowed here.
#
# The ids mean different things. For "add" the id is a right TYPE. For "update"
# and "remove" it is a right ROW, and a target to remove is a right_targets row.
# Each is looked up as what it is, because a request can name any id.
class UserUpdatePolicy
  # isChanged is a flag the client adds. The update ignores it.
  CHART_EDITOR_KEYS = %w[isChanged myrights].freeze

  def initialize(user:, target_id:, user_entity:)
    @user = user
    @target = User.find_by(id: as_id(target_id))
    @user_entity = user_entity
  end

  def allowed?
    return true if @user.is_admin?
    return false unless @user.can_edit_charts && @target

    changes = parse(@user_entity)
    return false unless changes.is_a?(Hash)
    return false unless (changes.keys - CHART_EDITOR_KEYS).empty?

    entries = changes.fetch("myrights", [])
    entries.is_a?(Array) && entries.all? { |entry| project_manager_change?(entry) }
  end

  private

  def project_manager_change?(entry)
    return false unless entry.is_a?(Hash)

    case entry["status"]
    when "add"    then adds_project_manager?(entry)
    when "update" then updates_project_manager?(entry)
    when "remove" then removes_project_manager?(entry)
    else false
    end
  end

  # The id is a right type, and the targets are charts to add.
  def adds_project_manager?(entry)
    type = RightType.find_by(id: as_id(entry["id"]))
    return false unless type && type.code == RightType::PROJECT_MANAGE

    targets = entry.fetch("targets", [])
    targets.is_a?(Array) && targets.all? { |target| adds_chart?(target) }
  end

  # The id is a right row of the target user. Targets are charts to add, or
  # right_targets rows of that same right to remove.
  def updates_project_manager?(entry)
    right = project_manager_right_of_target(entry["id"])
    return false unless right

    targets = entry["targets"]
    targets.is_a?(Array) &&
      targets.all? { |target| adds_chart?(target) || removes_target_of?(right, target) }
  end

  # The id is a right row of the target user. The update also removes any
  # targets listed, so those must belong to the same right.
  def removes_project_manager?(entry)
    right = project_manager_right_of_target(entry["id"])
    return false unless right

    targets = entry.fetch("targets", [])
    targets.is_a?(Array) && targets.all? { |target| removes_target_of?(right, target) }
  end

  def project_manager_right_of_target(id)
    right = Right.find_by(id: as_id(id))
    return unless right && right.role_id == @target.role_id
    right if right.right_type && right.right_type.code == RightType::PROJECT_MANAGE
  end

  def adds_chart?(target)
    target.is_a?(Hash) && target["status"] == "add" &&
      WorkChart.exists?(id: as_id(target["id"]))
  end

  def removes_target_of?(right, target)
    target.is_a?(Hash) && target["status"] == "remove" &&
      right.targets.exists?(id: as_id(target["id"]))
  end

  def parse(json)
    JSON.parse(json)
  rescue JSON::ParserError, TypeError
    nil
  end

  # An id from the request is only an id if it is a whole number. Anything else
  # would be handed to a query as a list or a pattern.
  def as_id(value)
    return value if value.is_a?(Integer)
    Integer(value, 10) if value.is_a?(String) && value.match?(/\A\d+\z/)
  end
end
